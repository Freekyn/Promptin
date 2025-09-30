// background.js - Service Worker for PromptInSTYL Chrome Extension

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default preferences on first install
    chrome.storage.sync.set({
      promptInstylPreferences: {
        selectedFormat: "txt",
        autoSavePrompts: true,
        syncPreferences: true,
        theme: "light",
        showNotifications: true,
        apiEndpoint: "http://localhost:3000",
      },
    });

    // Initialize usage statistics
    chrome.storage.local.set({
      usageStats: [],
      installDate: Date.now(),
      totalPrompts: 0,
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html"),
    });
  } else if (details.reason === "update") {
    // Handle extension updates
    const previousVersion = details.previousVersion;
    console.log(
      `PromptInSTYL updated from ${previousVersion} to ${
        chrome.runtime.getManifest().version
      }`
    );

    // Notify popup if it's open
    chrome.runtime
      .sendMessage({
        action: "extensionUpdated",
        previousVersion,
        currentVersion: chrome.runtime.getManifest().version,
      })
      .catch(() => {
        // Popup might not be open, ignore error
      });
  }
});

// Handle keyboard shortcuts
try {
  if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener((command) => {
      console.log('Command received:', command);
      if (command === "_execute_action") {
        chrome.action.openPopup();
      } else if (command === "quick-prompt") {
        // Custom shortcut for quick prompting
        handleQuickPrompt();
      }
    });
  } else {
    console.log('Chrome commands API not available');
  }
} catch (error) {
  console.error('Error setting up commands:', error);
}

// Context menu for quick access
chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

function createContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Main context menu
    chrome.contextMenus.create({
      id: "promptinstyl-main",
      title: "PromptInSTYL",
      contexts: ["selection", "page"],
    });

    // Generate prompt from selected text
    chrome.contextMenus.create({
      id: "generate-from-selection",
      parentId: "promptinstyl-main",
      title: "Generate prompt from selection",
      contexts: ["selection"],
    });

    // Quick access options
    chrome.contextMenus.create({
      id: "open-popup",
      parentId: "promptinstyl-main",
      title: "Open PromptInSTYL",
      contexts: ["page"],
    });

    // Export options submenu
    chrome.contextMenus.create({
      id: "export-submenu",
      parentId: "promptinstyl-main",
      title: "Export last prompt",
      contexts: ["page"],
    });

    // Export format options
    const formats = ["txt", "md", "html", "json"];
    formats.forEach((format) => {
      chrome.contextMenus.create({
        id: `export-${format}`,
        parentId: "export-submenu",
        title: `as ${format.toUpperCase()}`,
        contexts: ["page"],
      });
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "generate-from-selection":
      handleSelectionPrompt(info.selectionText, tab);
      break;
    case "open-popup":
      chrome.action.openPopup();
      break;
    default:
      if (info.menuItemId.startsWith("export-")) {
        const format = info.menuItemId.replace("export-", "");
        handleQuickExport(format);
      }
      break;
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "savePrompt":
      handleSavePrompt(request.data);
      sendResponse({ success: true });
      break;

    case "getStoredPrompts":
      getStoredPrompts().then((prompts) => {
        sendResponse({ prompts });
      });
      return true; // Keep message channel open for async response

    case "updateUsageStats":
      updateUsageStats(request.data);
      sendResponse({ success: true });
      break;

    case "checkServerStatus":
      checkServerStatus().then((status) => {
        sendResponse(status);
      });
      return true;

    case "exportPrompt":
      handleBackgroundExport(request.data);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: "Unknown action" });
  }
});

// Handle quick prompting functionality
async function handleQuickPrompt() {
  try {
    // Get active tab
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Try to get selected text from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => window.getSelection().toString(),
    });

    const selectedText = results[0]?.result;

    if (selectedText && selectedText.trim()) {
      // Open popup with pre-filled text
      chrome.storage.local.set({ quickPromptText: selectedText.trim() });
      chrome.action.openPopup();
    } else {
      // Just open popup normally
      chrome.action.openPopup();
    }
  } catch (error) {
    console.error("Quick prompt error:", error);
    chrome.action.openPopup(); // Fallback
  }
}

// Handle prompt generation from selected text
async function handleSelectionPrompt(selectedText, tab) {
  if (!selectedText || !selectedText.trim()) return;

  try {
    // Store the selected text for the popup to use
    await chrome.storage.local.set({
      quickPromptText: selectedText.trim(),
      sourceTab: {
        id: tab.id,
        title: tab.title,
        url: tab.url,
      },
    });

    // Open the popup
    chrome.action.openPopup();

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "PromptInSTYL",
      message:
        "Selected text loaded. Click the extension to generate a prompt.",
    });
  } catch (error) {
    console.error("Error handling selection prompt:", error);
  }
}

// Save prompt functionality
async function handleSavePrompt(promptData) {
  try {
    const result = await chrome.storage.local.get(["savedPrompts"]);
    const savedPrompts = result.savedPrompts || [];

    const newPrompt = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: promptData.prompt,
      role: promptData.role,
      framework: promptData.framework,
      confidence: promptData.confidence,
      tags: promptData.tags || [],
    };

    savedPrompts.unshift(newPrompt); // Add to beginning

    // Keep only last 100 prompts
    if (savedPrompts.length > 100) {
      savedPrompts.splice(100);
    }

    await chrome.storage.local.set({ savedPrompts });

    // Update total prompt count
    const stats = await chrome.storage.local.get(["totalPrompts"]);
    await chrome.storage.local.set({
      totalPrompts: (stats.totalPrompts || 0) + 1,
    });

    return true;
  } catch (error) {
    console.error("Error saving prompt:", error);
    return false;
  }
}

// Get stored prompts
async function getStoredPrompts() {
  try {
    const result = await chrome.storage.local.get(["savedPrompts"]);
    return result.savedPrompts || [];
  } catch (error) {
    console.error("Error retrieving prompts:", error);
    return [];
  }
}

// Update usage statistics
async function updateUsageStats(data) {
  try {
    const result = await chrome.storage.local.get(["usageStats"]);
    const stats = result.usageStats || [];

    stats.push({
      timestamp: Date.now(),
      action: data.action,
      role: data.role,
      format: data.format,
      confidence: data.confidence,
    });

    // Keep only last 1000 entries
    if (stats.length > 1000) {
      stats.splice(0, stats.length - 1000);
    }

    await chrome.storage.local.set({ usageStats: stats });
  } catch (error) {
    console.error("Error updating usage stats:", error);
  }
}

// Check server status
async function checkServerStatus() {
  try {
    const prefs = await chrome.storage.sync.get(["promptInstylPreferences"]);
    const apiEndpoint =
      prefs.promptInstylPreferences?.apiEndpoint || "http://localhost:3000";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${apiEndpoint}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        status: "online",
        data: data.data || {},
      };
    } else {
      return {
        status: "error",
        message: `Server returned ${response.status}`,
      };
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        status: "timeout",
        message: "Server connection timeout",
      };
    }
    return {
      status: "offline",
      message: error.message,
    };
  }
}

// Handle background export
async function handleBackgroundExport(exportData) {
  try {
    const blob = new Blob([exportData.content], { type: exportData.mimeType });
    const url = URL.createObjectURL(blob);

    // Use chrome.downloads API for background downloads
    chrome.downloads.download(
      {
        url: url,
        filename: exportData.filename,
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download error:", chrome.runtime.lastError);
        } else {
          // Clean up the blob URL after download starts
          setTimeout(() => URL.revokeObjectURL(url), 1000);

          // Show notification
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "PromptInSTYL Export",
            message: `Prompt exported as ${exportData.filename}`,
          });
        }
      }
    );
  } catch (error) {
    console.error("Background export error:", error);
  }
}

// Handle quick export of last prompt
async function handleQuickExport(format) {
  try {
    const prompts = await getStoredPrompts();
    if (prompts.length === 0) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "PromptInSTYL",
        message: "No prompts available to export",
      });
      return;
    }

    const lastPrompt = prompts[0];
    const timestamp = new Date(lastPrompt.timestamp)
      .toISOString()
      .slice(0, 16)
      .replace(/[-:]/g, "");

    let content = "";
    let mimeType = "text/plain";

    switch (format) {
      case "json":
        content = JSON.stringify(lastPrompt, null, 2);
        mimeType = "application/json";
        break;
      case "md":
        content = `# PromptInSTYL Export\n\n**Role:** ${
          lastPrompt.role || "Not specified"
        }\n**Generated:** ${new Date(
          lastPrompt.timestamp
        ).toLocaleString()}\n\n## Prompt\n\n\`\`\`\n${
          lastPrompt.prompt
        }\n\`\`\`\n\n---\n\n*Generated by PromptInSTYL*`;
        mimeType = "text/markdown";
        break;
      case "html":
        content = `<!DOCTYPE html><html><head><title>PromptInSTYL Export</title></head><body><h1>PromptInSTYL Export</h1><p><strong>Role:</strong> ${
          lastPrompt.role || "Not specified"
        }</p><p><strong>Generated:</strong> ${new Date(
          lastPrompt.timestamp
        ).toLocaleString()}</p><div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;"><pre>${
          lastPrompt.prompt
        }</pre></div></body></html>`;
        mimeType = "text/html";
        break;
      default: // txt
        content = `PromptInSTYL Export\n==================\n\nRole: ${
          lastPrompt.role || "Not specified"
        }\nGenerated: ${new Date(
          lastPrompt.timestamp
        ).toLocaleString()}\n\nPROMPT:\n${
          lastPrompt.prompt
        }\n\n---\nGenerated by PromptInSTYL`;
        mimeType = "text/plain";
    }

    await handleBackgroundExport({
      content,
      filename: `promptinstyl_${timestamp}.${format}`,
      mimeType,
    });
  } catch (error) {
    console.error("Quick export error:", error);
  }
}

// Periodic cleanup of old data
chrome.alarms.create("cleanup", { delayInMinutes: 60, periodInMinutes: 1440 }); // Daily cleanup

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup") {
    performCleanup();
  }
});

async function performCleanup() {
  try {
    // Clean up old usage stats (keep only last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const statsResult = await chrome.storage.local.get(["usageStats"]);
    const usageStats = statsResult.usageStats || [];
    const cleanedStats = usageStats.filter(
      (stat) => stat.timestamp > thirtyDaysAgo
    );

    if (cleanedStats.length !== usageStats.length) {
      await chrome.storage.local.set({ usageStats: cleanedStats });
    }

    // Clean up old saved prompts (keep only last 50)
    const promptsResult = await chrome.storage.local.get(["savedPrompts"]);
    const savedPrompts = promptsResult.savedPrompts || [];

    if (savedPrompts.length > 50) {
      const cleanedPrompts = savedPrompts.slice(0, 50);
      await chrome.storage.local.set({ savedPrompts: cleanedPrompts });
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

// Badge management
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBadge") {
    if (request.count > 0) {
      chrome.action.setBadgeText({ text: request.count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#4F46E5" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  }
});

// Handle extension icon click analytics
chrome.action.onClicked.addListener(() => {
  updateUsageStats({
    action: "popup_opened",
    timestamp: Date.now(),
  });
});
