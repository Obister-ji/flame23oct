import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import mcpService, { PlaywrightAction } from '@/services/mcpService';
import { Globe, FileText, Play, Settings, Terminal } from 'lucide-react';

const MCPPlayground: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [actionType, setActionType] = useState<PlaywrightAction['type']>('navigate');
  const [target, setTarget] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    initializeMCP();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const initializeMCP = async () => {
    try {
      setIsLoading(true);
      addLog('Initializing MCP service...');

      const response = await mcpService.initialize();

      if (response.success) {
        setIsConnected(true);
        addLog('✅ MCP service initialized successfully');
        toast.success('MCP service connected');
      } else {
        addLog(`❌ MCP initialization failed: ${response.error}`);
        toast.error(`MCP initialization failed: ${response.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ MCP error: ${errorMessage}`);
      toast.error(`MCP error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async () => {
    if (!isConnected) {
      toast.error('MCP service not connected');
      return;
    }

    if (!target && actionType !== 'screenshot') {
      toast.error('Please provide a target URL or selector');
      return;
    }

    try {
      setIsLoading(true);
      addLog(`🚀 Executing ${actionType} action...`);

      const action: PlaywrightAction = {
        type: actionType,
        ...(actionType === 'navigate' && { url: target }),
        ...(actionType !== 'navigate' && actionType !== 'screenshot' && { selector: target }),
        ...(actionType === 'type' && { value }),
        timeout: 5000
      };

      const response = await mcpService.executePlaywrightAction(action);

      if (response.success) {
        addLog(`✅ ${actionType} action completed successfully`);
        addLog(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
        toast.success(`${actionType} action completed`);
      } else {
        addLog(`❌ ${actionType} action failed: ${response.error}`);
        toast.error(`${actionType} action failed: ${response.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Action error: ${errorMessage}`);
      toast.error(`Action error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFileOperation = async (operation: 'read' | 'write') => {
    if (!isConnected) {
      toast.error('MCP service not connected');
      return;
    }

    try {
      setIsLoading(true);
      addLog(`📁 Testing ${operation} file operation...`);

      const response = operation === 'read'
        ? await mcpService.readFile('test.txt')
        : await mcpService.writeFile('test.txt', 'Hello from MCP Playground!');

      if (response.success) {
        addLog(`✅ File ${operation} operation completed successfully`);
        addLog(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
        toast.success(`File ${operation} completed`);
      } else {
        addLog(`❌ File ${operation} failed: ${response.error}`);
        toast.error(`File ${operation} failed: ${response.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ File operation error: ${errorMessage}`);
      toast.error(`File operation error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            FlameAI MCP Playground
          </CardTitle>
          <CardDescription>
            Test Model Context Protocol (MCP) integration with Playwright and filesystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected to MCP' : 'Disconnected from MCP'}
              </span>
            </div>
            <Button
              onClick={initializeMCP}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? 'Connecting...' : 'Reconnect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="playwright" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="playwright" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Playwright
          </TabsTrigger>
          <TabsTrigger value="filesystem" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Filesystem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playwright" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Playwright Globe Automation
              </CardTitle>
              <CardDescription>
                Test browser automation through MCP Playwright integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="action-type">Action Type</Label>
                  <Select value={actionType} onValueChange={(value: PlaywrightAction['type']) => setActionType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="navigate">Navigate to URL</SelectItem>
                      <SelectItem value="click">Click Element</SelectItem>
                      <SelectItem value="type">Type Text</SelectItem>
                      <SelectItem value="screenshot">Take Screenshot</SelectItem>
                      <SelectItem value="extract">Extract Content</SelectItem>
                      <SelectItem value="wait">Wait for Element</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">
                    {actionType === 'navigate' ? 'URL' : 'Selector'}
                  </Label>
                  <Input
                    id="target"
                    placeholder={
                      actionType === 'navigate'
                        ? 'https://example.com'
                        : '#element-id or .class-name'
                    }
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    disabled={actionType === 'screenshot'}
                  />
                </div>

                {actionType === 'type' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="value">Text to Type</Label>
                    <Input
                      id="value"
                      placeholder="Enter text to type..."
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={executeAction}
                disabled={isLoading || !isConnected}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Executing...' : 'Execute Action'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filesystem" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Filesystem Operations
              </CardTitle>
              <CardDescription>
                Test filesystem operations through MCP filesystem integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => testFileOperation('read')}
                  disabled={isLoading || !isConnected}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Read Test File
                </Button>
                <Button
                  onClick={() => testFileOperation('write')}
                  disabled={isLoading || !isConnected}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Write Test File
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            MCP Console
          </CardTitle>
          <CardDescription>
            Real-time logs from MCP operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Execute an MCP action to see logs here.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
            >
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPPlayground;