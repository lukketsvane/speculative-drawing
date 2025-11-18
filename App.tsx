
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Spinner } from './components/Spinner';
import { GeneratedImage } from './components/GeneratedImage';
import { generateSpeculativeDrawing } from './services/geminiService';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setUploadedImage(dataUrl);
      try {
        const { inlineData } = await fileToGenerativePart(file);
        const resultBase64 = await generateSpeculativeDrawing(inlineData.data, inlineData.mimeType);
        setGeneratedImage(`data:image/png;base64,${resultBase64}`);
      } catch (e) {
        console.error(e);
        setError('Failed to generate the drawing. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-700 flex items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
          </svg>
          Speculative Image Studio
        </h1>
        <p className="text-gray-500 mt-2">Transform your photos into conceptual line art.</p>
      </header>

      <main className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
          {!generatedImage && !isLoading && <ImageUploader onImageUpload={handleImageUpload} />}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-6">
              {uploadedImage && (
                <div className="w-full max-w-md p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <img src={uploadedImage} alt="Uploaded preview" className="max-h-80 w-auto object-contain mx-auto rounded-md" />
                </div>
              )}
              <Spinner />
            </div>
          )}

          {!isLoading && generatedImage && (
            <GeneratedImage imageData={generatedImage} onReset={handleReset} />
          )}

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>
      </main>
    </div>
  );
};

export default App;
