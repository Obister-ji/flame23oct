import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Image as ImageIcon, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SUPPORTED_FORMATS = [
  { value: 'png', label: 'PNG', description: 'Portable Network Graphics' },
  { value: 'jpeg', label: 'JPEG', description: 'Joint Photographic Experts Group' },
  { value: 'webp', label: 'WebP', description: 'Web Picture format' },
  { value: 'bmp', label: 'BMP', description: 'Bitmap Image' },
] as const;

type ImageFormat = typeof SUPPORTED_FORMATS[number]['value'];

interface ConvertedImage {
  blob: Blob;
  filename: string;
  originalFormat: string;
  newFormat: string;
}

const Pathfindra: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('png');
  const [convertedImage, setConvertedImage] = useState<ConvertedImage | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setConvertedImage(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const convertImage = async () => {
    if (!selectedFile) return;

    setIsConverting(true);

    try {
      // Create canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Create image element
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(selectedFile);
      });

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0);

      // Convert to blob with desired format
      const quality = outputFormat === 'jpeg' ? 0.9 : undefined;
      const mimeType = `image/${outputFormat}`;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert image'));
          },
          mimeType,
          quality
        );
      });

      // Generate filename
      const originalName = selectedFile.name.split('.')[0];
      const filename = `${originalName}_converted.${outputFormat}`;

      const converted: ConvertedImage = {
        blob,
        filename,
        originalFormat: selectedFile.type.split('/')[1],
        newFormat: outputFormat,
      };

      setConvertedImage(converted);
      
      toast({
        title: 'Conversion successful!',
        description: `Image converted to ${outputFormat.toUpperCase()} format.`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: 'Conversion failed',
        description: 'An error occurred while converting the image.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadImage = () => {
    if (!convertedImage) return;

    const url = URL.createObjectURL(convertedImage.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedImage.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: `${convertedImage.filename} is downloading.`,
    });
  };

  const resetConverter = () => {
    setSelectedFile(null);
    setConvertedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 pt-24">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Image */}
          <div className="order-2 md:order-1">
            <img
              src="/src/assets/pathfindra.jpg"
              alt="PATHFINDRA Image Converter"
              className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg"
            />
          </div>
          
          {/* Right Column - Content */}
          <div className="order-1 md:order-2 text-center md:text-left">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
              PATHFINDRA
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Advanced image path conversion and optimization tool for seamless file management
            </p>
          </div>
        </div>

        {/* Main converter card */}
        <Card className="bg-white rounded-lg shadow-md border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-primary font-semibold">
              <Zap className="h-5 w-5 text-primary" />
              Convert Your Image
            </CardTitle>
            <CardDescription>
              Upload an image file and select your desired output format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="min-w-0 flex-1 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={resetConverter}
                    variant="ghost"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Format selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as ImageFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {format.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Convert button */}
            <Button
              onClick={convertImage}
              disabled={!selectedFile || isConverting}
              className="w-full bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-300"
              size="lg"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  Converting...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Convert Image
                </>
              )}
            </Button>

            {/* Download section */}
            {convertedImage && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-primary">Conversion Complete!</h3>
                    <p className="text-sm text-muted-foreground">
                      {convertedImage.originalFormat.toUpperCase()} → {convertedImage.newFormat.toUpperCase()}
                    </p>
                  </div>
                  <Button onClick={downloadImage} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview section */}
        {previewUrl && (
          <Card className="bg-white rounded-lg shadow-md border border-border">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Your uploaded image preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works Section */}
        <div className="relative overflow-hidden rounded-2xl bg-card p-8 border border-border">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-accent opacity-10 blur-3xl rounded-full"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-3 text-primary">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow these simple steps to convert your images instantly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Upload',
                  description: 'Select your image file from your device',
                  icon: Upload,
                },
                {
                  step: '02',
                  title: 'Choose Format',
                  description: 'Pick your desired output format',
                  icon: ImageIcon,
                },
                {
                  step: '03',
                  title: 'Convert',
                  description: 'Click convert and let the magic happen',
                  icon: Zap,
                },
                {
                  step: '04',
                  title: 'Download',
                  description: 'Get your converted image instantly',
                  icon: Download,
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="group relative animate-fade-in hover-scale"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-full p-6 rounded-xl bg-white border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                      {item.step}
                    </div>
                    
                    <div className="mt-4 mb-4 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Paths Section */}
        <Card className="bg-white rounded-lg shadow-md border border-border overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Conversion Paths
            </CardTitle>
            <CardDescription>
              Convert between any format seamlessly - all paths supported
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                { from: 'PNG', to: 'JPEG', use: 'Perfect for reducing file size while maintaining quality', color: 'from-blue-500/20 to-purple-500/20' },
                { from: 'JPEG', to: 'WebP', use: 'Optimize for web with superior compression', color: 'from-purple-500/20 to-pink-500/20' },
                { from: 'WebP', to: 'PNG', use: 'Get lossless quality with transparency support', color: 'from-pink-500/20 to-orange-500/20' },
                { from: 'BMP', to: 'PNG', use: 'Compress large bitmap files efficiently', color: 'from-orange-500/20 to-green-500/20' },
              ].map((path, index) => (
                <div
                  key={index}
                  className="group relative p-4 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${path.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-lg`}></div>
                  
                  <div className="relative flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="px-4 py-2 rounded-lg bg-primary/10 font-semibold text-primary">
                        {path.from}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-accent/50 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                          <Zap className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-accent/10 font-semibold text-accent-foreground">
                        {path.to}
                      </div>
                    </div>
                  </div>
                  
                  <p className="relative mt-3 text-sm text-muted-foreground pl-2 border-l-2 border-primary/30">
                    {path.use}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-center text-muted-foreground">
                💡 <span className="font-medium text-foreground">Pro Tip:</span> All conversions preserve image dimensions and quality settings automatically
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info section */}
        <Card className="bg-white rounded-lg shadow-md border border-border">
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
            <CardDescription>
              All conversions happen locally in your browser - your images never leave your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUPPORTED_FORMATS.map((format) => (
                <div key={format.value} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{format.label}</h4>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Pathfindra;