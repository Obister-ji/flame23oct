import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiService } from '@/services/emailApi';
import { secureWebhookService } from '@/services/secureWebhookService';

interface SecurityStatus {
  rateLimitStatus: { count: number; resetTime: number };
  recentIncidents: Array<{
    requestId: string;
    clientId: string;
    error: string;
    timestamp: number;
    type: string;
  }>;
  configStatus: {
    hasApiKey: boolean;
    hasSecretKey: boolean;
    hasWebhookUrl: boolean;
    httpsEnabled: boolean;
  };
}

interface ServerSecurityStatus {
  config: {
    rateLimitWindow: number;
    rateLimitMax: number;
    timestampTolerance: number;
  };
  statistics: {
    activeApiKeys: number;
    storedNonces: number;
    recentIncidents: Array<{
      id: string;
      type: string;
      timestamp: number;
    }>;
  };
  health: string;
}

export function SecurityMonitor() {
  const [clientSecurityStatus, setClientSecurityStatus] = useState<SecurityStatus | null>(null);
  const [serverSecurityStatus, setServerSecurityStatus] = useState<ServerSecurityStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('client');

  const fetchSecurityStatus = async () => {
    setIsRefreshing(true);
    try {
      // Get client-side security status
      const clientStatus = apiService.getSecurityStatus();
      setClientSecurityStatus(clientStatus);

      // Try to get server-side security status
      try {
        const response = await fetch('http://localhost:3002/api/security-status', {
          headers: {
            'X-API-Key': process.env.REACT_APP_SECURE_API_KEY || 'demo-key'
          }
        });
        
        if (response.ok) {
          const serverStatus = await response.json();
          setServerSecurityStatus(serverStatus);
        }
      } catch (serverError) {
        console.warn('Could not fetch server security status:', serverError);
      }
    } catch (error) {
      console.error('Error fetching security status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
    const interval = setInterval(fetchSecurityStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeRemaining = (resetTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, resetTime - now);
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'RATE_LIMIT_EXCEEDED':
      case 'REPLAY_ATTACK':
      case 'INVALID_SIGNATURE':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'VALIDATION_FAILED':
      case 'MISSING_SECURITY_HEADERS':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSecurityLevel = () => {
    if (!clientSecurityStatus) return { level: 'Unknown', color: 'gray' };
    
    const { configStatus } = clientSecurityStatus;
    const secureFeatures = Object.values(configStatus).filter(Boolean).length;
    const totalFeatures = Object.keys(configStatus).length;
    
    if (secureFeatures === totalFeatures) {
      return { level: 'High', color: 'green' };
    } else if (secureFeatures >= totalFeatures / 2) {
      return { level: 'Medium', color: 'yellow' };
    } else {
      return { level: 'Low', color: 'red' };
    }
  };

  const clearSecurityData = () => {
    secureWebhookService.clearSecurityData();
    apiService.clearSecurityData();
    fetchSecurityStatus();
  };

  const securityLevel = getSecurityLevel();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Security Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={`outline`} className={`text-${securityLevel.color}-500`}>
                Security Level: {securityLevel.level}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSecurityStatus}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSecurityData}
              >
                Clear Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client">Client Security</TabsTrigger>
              <TabsTrigger value="server">Server Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="client" className="space-y-4">
              {clientSecurityStatus && (
                <>
                  {/* Configuration Status */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(clientSecurityStatus.configStatus).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rate Limit Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rate Limit Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Requests in current window:</span>
                          <span className="font-mono">{clientSecurityStatus.rateLimitStatus.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Window resets in:</span>
                          <span className="font-mono">
                            {formatTimeRemaining(clientSecurityStatus.rateLimitStatus.resetTime)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Incidents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Security Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {clientSecurityStatus.recentIncidents.length > 0 ? (
                        <div className="space-y-2">
                          {clientSecurityStatus.recentIncidents.map((incident, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                              {getIncidentIcon(incident.type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{incident.type}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {incident.error}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(incident.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          No recent security incidents
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="server" className="space-y-4">
              {serverSecurityStatus ? (
                <>
                  {/* Server Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Server Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Rate Limit Window</div>
                          <div className="font-mono">
                            {serverSecurityStatus.config.rateLimitWindow / 1000}s
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Max Requests</div>
                          <div className="font-mono">
                            {serverSecurityStatus.config.rateLimitMax}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Timestamp Tolerance</div>
                          <div className="font-mono">
                            {serverSecurityStatus.config.timestampTolerance / 1000}s
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Server Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Server Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Active API Keys</div>
                          <div className="font-mono">
                            {serverSecurityStatus.statistics.activeApiKeys}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Stored Nonces</div>
                          <div className="font-mono">
                            {serverSecurityStatus.statistics.storedNonces}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Health Status</div>
                          <Badge variant={serverSecurityStatus.health === 'healthy' ? 'default' : 'destructive'}>
                            {serverSecurityStatus.health}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Server Incidents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Server Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {serverSecurityStatus.statistics.recentIncidents.length > 0 ? (
                        <div className="space-y-2">
                          {serverSecurityStatus.statistics.recentIncidents.map((incident, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                              {getIncidentIcon(incident.type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{incident.type}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(incident.timestamp)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          No recent server incidents
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  Server security status unavailable
                  <div className="text-sm mt-2">
                    Make sure the secure server is running on port 3002
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}