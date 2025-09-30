// Enhanced Chrome Extension JavaScript with Firebase Authentication
// popup.js

class PromptInSTYLExtension {
  constructor() {
    this.apiBase = "https://server-thrumming-paper-2833.fly.dev/api";
    this.selectedRole = null;
    this.selectedFramework = null;
    this.selectedFormat = "txt";
    this.generatedPrompt = "";
    this.platformRecommendations = [];
    this.currentAnalysis = null;
    this.user = null;
    this.authToken = null;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupAuthListeners();
    await this.checkAuthState();
    await this.loadRoles();
    await this.loadFrameworks();
    this.loadUserPreferences();
  }

  setupEventListeners() {
    // Collapsible sections
    document.querySelectorAll(".collapsible-header").forEach((header) => {
      header.addEventListener("click", () => {
        this.toggleCollapsible(header);
      });
    });

    // Role selection
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("category-btn")) {
        this.selectRoleCategory(e.target.dataset.category);
      }
      if (e.target.classList.contains("role-item")) {
        this.selectRole(e.target.dataset.role);
      }
    });

    // Custom role toggle
    document
      .getElementById("custom-role-toggle")
      .addEventListener("change", (e) => {
        this.toggleCustomRole(e.target.checked);
      });

    // Custom role input
    document.getElementById("custom-role").addEventListener("input", (e) => {
      this.selectedRole = e.target.value.trim();
    });

    // Framework selection
    document
      .getElementById("framework-select")
      .addEventListener("change", (e) => {
        this.selectedFramework = e.target.value;
      });

    // Format selection
    document.querySelectorAll(".format-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectFormat(btn.dataset.format);
      });
    });

    // Generate button
    document.getElementById("generate-btn").addEventListener("click", () => {
      this.generateEnhancedPrompt();
    });

    // Export actions
    document.getElementById("preview-btn").addEventListener("click", () => {
      this.previewExport();
    });

    document.getElementById("download-btn").addEventListener("click", () => {
      this.downloadPrompt();
    });

    document.getElementById("copy-btn").addEventListener("click", () => {
      this.copyPrompt();
    });
  }

  setupAuthListeners() {
    // Auth tab switching
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.switchAuthTab(tab.dataset.tab);
      });
    });

    // Login form
    document.getElementById("login-btn").addEventListener("click", () => {
      this.handleLogin();
    });

    // Register form
    document.getElementById("register-btn").addEventListener("click", () => {
      this.handleRegister();
    });

    // Google sign in
    document.getElementById("google-signin-btn").addEventListener("click", () => {
      this.handleGoogleSignIn();
    });

    // Sign out
    document.getElementById("sign-out-btn").addEventListener("click", () => {
      this.handleSignOut();
    });

    // Enter key handlers
    document.getElementById("login-password").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleLogin();
    });

    document.getElementById("register-password").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleRegister();
    });
  }

  switchAuthTab(tab) {
    // Update tab UI
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    document.querySelector(`[data-tab="${tab}"]`).classList.add("active");

    // Show/hide forms
    document.getElementById("login-form").style.display = tab === "login" ? "flex" : "none";
    document.getElementById("register-form").style.display = tab === "register" ? "flex" : "none";

    // Clear errors
    document.getElementById("auth-error").style.display = "none";
    document.getElementById("register-error").style.display = "none";
  }

  async checkAuthState() {
    try {
      // Check if user is already authenticated
      const storedUser = await this.getStoredUser();
      if (storedUser) {
        this.user = storedUser;
        this.authToken = await this.getStoredToken();
        this.showAuthenticatedUI();
        return;
      }

      // Set up Firebase auth state listener
      if (typeof window.auth !== 'undefined') {
        window.auth.onAuthStateChanged(async (user) => {
          if (user) {
            this.user = user;
            const token = await user.getIdToken();
            this.handleAuthSuccess(user, token);
          } else {
            this.showAuthUI();
          }
        });
      } else {
        this.showAuthUI();
      }
    } catch (error) {
      console.error("Auth state check failed:", error);
      this.showAuthUI();
    }
  }

  async handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      this.showAuthError("Please fill in all fields", "auth-error");
      return;
    }

    try {
      this.showAuthLoading(true);
      const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
      const token = await userCredential.user.getIdToken();
      await this.handleAuthSuccess(userCredential.user, token);
    } catch (error) {
      this.showAuthError(this.getAuthErrorMessage(error), "auth-error");
    } finally {
      this.showAuthLoading(false);
    }
  }

  async handleRegister() {
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;

    if (!name || !email || !password) {
      this.showAuthError("Please fill in all fields", "register-error");
      return;
    }

    if (password.length < 6) {
      this.showAuthError("Password must be at least 6 characters", "register-error");
      return;
    }

    try {
      this.showAuthLoading(true);
      const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
      
      // Update display name
      await userCredential.user.updateProfile({
        displayName: name
      });

      const token = await userCredential.user.getIdToken();
      await this.handleAuthSuccess(userCredential.user, token);
    } catch (error) {
      this.showAuthError(this.getAuthErrorMessage(error), "register-error");
    } finally {
      this.showAuthLoading(false);
    }
  }

  async handleGoogleSignIn() {
    try {
      this.showAuthLoading(true);
      // For Chrome extension, we'll use a popup-based Google sign-in
      // This is a simplified version - in production, you'd use proper OAuth flow
      this.showAuthError("Google sign-in not yet implemented. Please use email/password.", "auth-error");
    } catch (error) {
      this.showAuthError("Google sign-in failed", "auth-error");
    } finally {
      this.showAuthLoading(false);
    }
  }

  async handleSignOut() {
    try {
      await window.signOut(window.auth);
      this.user = null;
      this.authToken = null;
      await this.clearStoredAuth();
      this.showAuthUI();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  async handleAuthSuccess(user, token) {
    this.user = user;
    this.authToken = token;
    
    // Store auth data
    await this.storeAuthData(user, this.authToken);
    
    // Show authenticated UI
    this.showAuthenticatedUI();
  }

  showAuthUI() {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("user-bar").style.display = "none";
    document.getElementById("main-content").style.display = "none";
  }

  showAuthenticatedUI() {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("user-bar").style.display = "flex";
    document.getElementById("main-content").style.display = "block";
    
    // Update user info
    const userName = this.user.displayName || this.user.email.split('@')[0];
    document.getElementById("user-name").textContent = userName;
    document.getElementById("user-avatar").textContent = userName.charAt(0).toUpperCase();
  }

  showAuthError(message, errorId) {
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = message;
    errorElement.style.display = "block";
    
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000);
  }

  showAuthLoading(show) {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    
    if (show) {
      loginBtn.textContent = "Signing in...";
      registerBtn.textContent = "Creating account...";
      loginBtn.disabled = true;
      registerBtn.disabled = true;
    } else {
      loginBtn.textContent = "→";
      registerBtn.textContent = "→";
      loginBtn.disabled = false;
      registerBtn.disabled = false;
    }
  }

  getAuthErrorMessage(error) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Email is already registered";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later";
      default:
        return error.message || "Authentication failed";
    }
  }

  async storeAuthData(user, token) {
    try {
      await chrome.storage.local.set({
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        },
        authToken: token
      });
    } catch (error) {
      console.error("Failed to store auth data:", error);
    }
  }

  async getStoredUser() {
    try {
      const result = await chrome.storage.local.get(['user']);
      return result.user || null;
    } catch (error) {
      console.error("Failed to get stored user:", error);
      return null;
    }
  }

  async getStoredToken() {
    try {
      const result = await chrome.storage.local.get(['authToken']);
      return result.authToken || null;
    } catch (error) {
      console.error("Failed to get stored token:", error);
      return null;
    }
  }

  async clearStoredAuth() {
    try {
      await chrome.storage.local.remove(['user', 'authToken']);
    } catch (error) {
      console.error("Failed to clear stored auth:", error);
    }
  }

  toggleCollapsible(header) {
    const target = header.dataset.target;
    const content = document.getElementById(target);
    const icon = header.querySelector(".collapsible-icon");

    if (content.classList.contains("active")) {
      content.classList.remove("active");
      header.classList.remove("active");
    } else {
      // Close all other collapsibles
      document.querySelectorAll(".collapsible-content.active").forEach((el) => {
        el.classList.remove("active");
      });
      document.querySelectorAll(".collapsible-header.active").forEach((el) => {
        el.classList.remove("active");
      });

      // Open this one
      content.classList.add("active");
      header.classList.add("active");
    }
  }

  async loadRoles() {
    try {
      const headers = {};
      
      // Add authentication header if user is logged in
      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiBase}/roles`, { headers });
      
      if (response.status === 401) {
        // If not authenticated, load basic roles from local data
        this.loadBasicRoles();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text.trim()) {
        console.warn('Empty response from server, using fallback data');
        this.loadBasicRoles();
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        this.loadBasicRoles();
        return;
      }

      if (data.success) {
        this.rolesData = data.data.allRoles;
        this.updateRoleCategoriesUI();
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
      this.loadBasicRoles();
    }
  }

  loadBasicRoles() {
    // Basic roles for unauthenticated users
    this.rolesData = {
      creative: ["Copywriter", "Content Creator", "Graphic Designer", "Video Editor"],
      technical: ["Software Developer", "Data Scientist", "DevOps Engineer", "System Administrator"],
      business: ["Marketing Manager", "Sales Representative", "Project Manager", "Business Analyst"],
      education: ["Teacher", "Curriculum Developer", "Educational Consultant", "Training Specialist"],
      healthcare: ["Doctor", "Nurse", "Medical Researcher", "Healthcare Administrator"]
    };
    this.updateRoleCategoriesUI();
  }

  updateRoleCategoriesUI() {
    // Role categories are already in HTML, just need to handle clicks
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".category-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  async selectRoleCategory(category) {
    if (!this.rolesData[category]) return;

    const roleList = document.getElementById("role-list");
    roleList.innerHTML = "";

    this.rolesData[category].forEach((role) => {
      const roleItem = document.createElement("div");
      roleItem.className = "role-item";
      roleItem.dataset.role = role;
      roleItem.textContent = role;
      roleList.appendChild(roleItem);
    });

    roleList.style.display = "block";
  }

  selectRole(role) {
    this.selectedRole = role;

    // Update UI
    document.querySelectorAll(".role-item").forEach((item) => {
      item.classList.remove("selected");
    });
    document.querySelector(`[data-role="${role}"]`)?.classList.add("selected");

    // Disable custom role input
    document.getElementById("custom-role-toggle").checked = false;
    document.getElementById("custom-role").style.display = "none";
    document.getElementById("custom-role").value = "";
  }

  toggleCustomRole(enabled) {
    const customInput = document.getElementById("custom-role");

    if (enabled) {
      customInput.style.display = "block";
      customInput.focus();
      // Clear role selection
      document.querySelectorAll(".role-item").forEach((item) => {
        item.classList.remove("selected");
      });
      this.selectedRole = null;
    } else {
      customInput.style.display = "none";
      customInput.value = "";
      this.selectedRole = null;
    }
  }

  async loadFrameworks() {
    try {
      const headers = {};
      
      // Add authentication header if user is logged in
      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiBase}/frameworks/list?limit=100`, { headers });
      
      if (response.status === 401) {
        // If not authenticated, load basic frameworks from local data
        this.loadBasicFrameworks();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text.trim()) {
        console.warn('Empty response from server, using fallback data');
        this.loadBasicFrameworks();
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        this.loadBasicFrameworks();
        return;
      }

      if (data.success) {
        this.populateFrameworkSelect(data.data.frameworks);
      }
    } catch (error) {
      console.error("Failed to load frameworks:", error);
      this.loadBasicFrameworks();
    }
  }

  loadBasicFrameworks() {
    // Basic frameworks for unauthenticated users
    const basicFrameworks = [
      { name: "Basic Prompt", description: "Simple, direct prompt structure" },
      { name: "Chain of Thought", description: "Step-by-step reasoning approach" },
      { name: "Few-Shot Learning", description: "Examples-based prompting" },
      { name: "Role-Based", description: "Act as a specific professional" }
    ];
    this.populateFrameworkSelect(basicFrameworks);
  }

  populateFrameworkSelect(frameworks) {
    const select = document.getElementById("framework-select");

    // Clear existing options (except the first one)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }

    // Add frameworks grouped by category
    Object.entries(frameworks).forEach(([category, frameworkList]) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = category;

      frameworkList.forEach((framework) => {
        const option = document.createElement("option");
        option.value = framework.id;
        option.textContent = `${framework.name} (${framework.complexity_level})`;
        option.title = framework.description;
        optgroup.appendChild(option);
      });

      select.appendChild(optgroup);
    });
  }

  selectFormat(format) {
    this.selectedFormat = format;

    // Update UI
    document.querySelectorAll(".format-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-format="${format}"]`).classList.add("active");
  }

  async generateEnhancedPrompt() {
    // Check if user is authenticated
    if (!this.user || !this.authToken) {
      this.showError("Please sign in to generate prompts.");
      this.showAuthUI();
      return;
    }

    const userRequest = document.getElementById("userRequest").value.trim();

    if (!userRequest || userRequest.length < 5) {
      this.showError("Please enter a request with at least 5 characters.");
      return;
    }

    this.showLoading(true);
    this.hideError();

    try {
      const requestData = {
        userRequest,
        selectedRole: this.selectedRole,
        selectedFramework: this.selectedFramework || undefined,
      };

      const headers = {
        "Content-Type": "application/json",
      };

      // Add authentication header if user is logged in
      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiBase}/analyze-intent-enhanced`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text.trim()) {
        console.warn('Empty response from server');
        this.showError("Server returned empty response. Please try again.");
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        this.showError("Invalid response from server. Please try again.");
        return;
      }

      if (data.success) {
        this.currentAnalysis = data.data;
        this.generatedPrompt =
          data.data.framework.enhancedPrompt ||
          data.data.framework.selected.base_prompt;
        this.platformRecommendations = data.data.platformRecommendations;

        this.displayResults();
        this.saveUserPreferences();
      } else {
        this.showError(data.error || "Failed to generate prompt");
      }
    } catch (error) {
      console.error("Generation error:", error);
      this.showError("Failed to connect to the server. Please try again.");
    } finally {
      this.showLoading(false);
    }
  }

  displayResults() {
    const resultSection = document.getElementById("result-section");
    const promptDisplay = document.getElementById("result-prompt");
    const confidenceFill = document.getElementById("confidence-fill");
    const confidenceText = document.getElementById("confidence-text");
    const platformsDisplay = document.getElementById("result-platforms");

    // Show results section
    resultSection.classList.add("visible");

    // Display prompt
    promptDisplay.textContent = this.generatedPrompt;

    // Update confidence bar
    const confidence = this.currentAnalysis.metadata.confidence.overall;
    confidenceFill.style.width = `${confidence}%`;
    confidenceText.textContent = `Confidence: ${confidence}%`;

    // Display platform recommendations
    this.displayPlatformRecommendations();

    // Scroll to results
    resultSection.scrollIntoView({ behavior: "smooth" });
  }

  displayPlatformRecommendations() {
    const platformContent = document.getElementById("platform-content");
    const resultPlatforms = document.getElementById("result-platforms");

    if (
      !this.platformRecommendations ||
      !this.platformRecommendations.recommendations
    ) {
      return;
    }

    const recommendationsHTML = this.platformRecommendations.recommendations
      .map(
        (platform) => `
            <div class="platform-item">
                <div class="platform-name">
                    ${platform.name}
                    <span class="platform-score">${platform.score}</span>
                </div>
                <div class="platform-strength">${platform.strength}</div>
            </div>
        `
      )
      .join("");

    // Update both locations
    platformContent.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong style="font-size: 12px;">Best for ${this.platformRecommendations.useCase.replace(
                  "-",
                  " "
                )}:</strong>
            </div>
            ${recommendationsHTML}
        `;

    resultPlatforms.innerHTML = `
            <h4 style="font-size: 13px; margin-bottom: 8px; color: #374151;">🎯 Recommended AI Platforms</h4>
            ${recommendationsHTML}
        `;
  }

  async previewExport() {
    if (!this.generatedPrompt) {
      this.showError("Please generate a prompt first");
      return;
    }

    try {
      const exportData = await this.prepareExportData();

      // Create preview modal
      const modal = document.createElement("div");
      modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

      const content = document.createElement("div");
      content.style.cssText = `
                background: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                position: relative;
            `;

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
            `;

      const previewContent = document.createElement("pre");
      previewContent.style.cssText = `
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 12px;
                margin-top: 20px;
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                overflow: auto;
            `;
      previewContent.textContent = exportData.content;

      content.appendChild(closeBtn);
      content.appendChild(
        document.createTextNode(`Preview - ${exportData.filename}`)
      );
      content.appendChild(previewContent);
      modal.appendChild(content);
      document.body.appendChild(modal);

      // Close modal events
      closeBtn.onclick = () => document.body.removeChild(modal);
      modal.onclick = (e) => {
        if (e.target === modal) document.body.removeChild(modal);
      };
    } catch (error) {
      this.showError("Failed to generate preview");
    }
  }

  async downloadPrompt() {
    if (!this.generatedPrompt) {
      this.showError("Please generate a prompt first");
      return;
    }

    try {
      const exportData = await this.prepareExportData();

      // Handle special formats
      if (this.selectedFormat === "pdf") {
        await this.downloadAsPDF(exportData);
      } else if (this.selectedFormat === "png") {
        await this.downloadAsPNG(exportData);
      } else {
        // Standard text-based formats
        this.downloadAsFile(exportData);
      }
    } catch (error) {
      console.error("Download error:", error);
      this.showError("Failed to download file");
    }
  }

  async prepareExportData() {
    const exportPayload = {
      prompt: this.generatedPrompt,
      role: this.selectedRole,
      framework: this.currentAnalysis?.framework?.selected,
      format: this.selectedFormat,
      metadata: {
        confidence: this.currentAnalysis?.metadata?.confidence?.overall,
        platforms: this.platformRecommendations,
        generatedAt: new Date().toISOString(),
      },
    };

    const headers = {
      "Content-Type": "application/json",
    };

    // Add authentication header if user is logged in
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.apiBase}/export-prompt`, {
      method: "POST",
      headers,
      body: JSON.stringify(exportPayload),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Export failed");
    }

    return data.data;
  }

  downloadAsFile(exportData) {
    const blob = new Blob([exportData.content], {
      type: exportData.contentType,
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = exportData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async downloadAsPDF(exportData) {
    // For PDF, we need to use a library like jsPDF or send to server
    // For now, we'll create an HTML version and let user print to PDF
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>PromptInSTYL Export</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 20px; }
                    .prompt { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { margin-top: 40px; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PromptInSTYL Export</h1>
                    <p><strong>Role:</strong> ${
                      this.selectedRole || "Not specified"
                    }</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div class="prompt">
                    <h2>Generated Prompt</h2>
                    <pre style="white-space: pre-wrap;">${
                      this.generatedPrompt
                    }</pre>
                </div>
                <div class="footer">
                    <p><strong>PromptInSTYL</strong> - World-Class AI Prompt Engineering Platform</p>
                    <p>https://promptinstyl.com</p>
                </div>
            </body>
            </html>
        `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Open in new window for printing
    const printWindow = window.open(url);
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  async downloadAsPNG(exportData) {
    // Create a canvas to render text as image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 800;
    canvas.height = 1000;

    // Style the canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Add title
    ctx.fillStyle = "#4F46E5";
    ctx.font = "bold 24px Arial";
    ctx.fillText("PromptInSTYL", 40, 60);

    // Add role
    ctx.fillStyle = "#333333";
    ctx.font = "16px Arial";
    ctx.fillText(`Role: ${this.selectedRole || "Not specified"}`, 40, 90);

    // Add prompt (with text wrapping)
    ctx.font = "14px Arial";
    const lines = this.wrapText(ctx, this.generatedPrompt, canvas.width - 80);
    let y = 130;

    lines.forEach((line) => {
      ctx.fillText(line, 40, y);
      y += 20;
    });

    // Add footer
    ctx.fillStyle = "#666666";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Generated by PromptInSTYL - promptinstyl.com",
      canvas.width / 2,
      canvas.height - 40
    );

    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompt_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  async copyPrompt() {
    if (!this.generatedPrompt) {
      this.showError("Please generate a prompt first");
      return;
    }

    try {
      await navigator.clipboard.writeText(this.generatedPrompt);

      // Visual feedback
      const copyBtn = document.getElementById("copy-btn");
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "✅ Copied!";
      copyBtn.style.background = "#10B981";

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = "#6366F1";
      }, 2000);
    } catch (error) {
      this.showError("Failed to copy to clipboard");
    }
  }

  showLoading(show) {
    const loading = document.getElementById("loading");
    const generateBtn = document.getElementById("generate-btn");

    if (show) {
      loading.style.display = "flex";
      generateBtn.disabled = true;
      generateBtn.textContent = "Generating...";
    } else {
      loading.style.display = "none";
      generateBtn.disabled = false;
      generateBtn.textContent = "🚀 Generate Enhanced Prompt";
    }
  }

  showError(message) {
    const errorDiv = document.getElementById("error");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }

  hideError() {
    document.getElementById("error").style.display = "none";
  }

  saveUserPreferences() {
    const preferences = {
      selectedRole: this.selectedRole,
      selectedFormat: this.selectedFormat,
      timestamp: Date.now(),
    };

    // Use Chrome storage API for syncing across devices
    if (chrome && chrome.storage) {
      chrome.storage.sync.set({ promptInstylPreferences: preferences });
    } else {
      // Fallback to localStorage
      localStorage.setItem(
        "promptInstylPreferences",
        JSON.stringify(preferences)
      );
    }
  }

  loadUserPreferences() {
    if (chrome && chrome.storage) {
      chrome.storage.sync.get(["promptInstylPreferences"], (result) => {
        if (result.promptInstylPreferences) {
          this.applyPreferences(result.promptInstylPreferences);
        }
      });
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem("promptInstylPreferences");
      if (stored) {
        this.applyPreferences(JSON.parse(stored));
      }
    }
  }

  applyPreferences(preferences) {
    if (preferences.selectedRole) {
      this.selectedRole = preferences.selectedRole;
      // Visual update will happen when roles are loaded
    }

    if (preferences.selectedFormat) {
      this.selectFormat(preferences.selectedFormat);
    }
  }
}

// Extension will be initialized by the HTML file after Firebase loads
