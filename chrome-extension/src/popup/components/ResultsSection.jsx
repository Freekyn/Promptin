import React, { useState } from 'react';

const ResultsSection = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const generatedPrompt = result.framework?.enhancedPrompt || result.framework?.selected?.base_prompt || 'No prompt generated';
  const confidence = result.metadata?.confidence?.overall || 0;
  const platformRecommendations = result.platformRecommendations?.recommendations || [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };


  const handlePreview = () => {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PromptInSTYL Preview</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px; }
          .prompt { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PromptInSTYL Export</h1>
          <p><strong>Role:</strong> ${result.selectedRole || 'Not specified'}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="prompt">
          <h2>Generated Prompt</h2>
          <pre style="white-space: pre-wrap;">${generatedPrompt}</pre>
        </div>
        <div class="footer">
          <p><strong>PromptInSTYL</strong> - World-Class AI Prompt Engineering Platform</p>
        </div>
      </body>
      </html>
    `);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Prompt</h3>
      
      {/* Confidence Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Confidence Score</span>
          <span className="text-sm text-gray-600">{confidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${confidence}%` }}
          ></div>
        </div>
      </div>

      {/* Generated Prompt */}
      <div className="mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {generatedPrompt}
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={handlePreview}
          className="flex-1 btn-secondary flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </button>
        
        
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center ${
            copied ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
          } text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Platform Recommendations */}
      {platformRecommendations.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">🎯 Recommended AI Platforms</h4>
          <div className="space-y-2">
            {platformRecommendations.slice(0, 3).map((platform, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-gray-900">{platform.name}</div>
                  <div className="text-xs text-gray-600">{platform.strength}</div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {platform.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSection;
