import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "SillyTavern-Ghostfinder";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionDisplayName = "Ghostfinder";

// Helper for debug logging
function log(...args) {
    if (extension_settings[extensionName]?.debugMode) {
        console.log(`[${extensionDisplayName}]`, ...args);
    }
}

// Helper for regular logging
function info(...args) {
    console.log(`[${extensionDisplayName}]`, ...args);
}

// Default settings
const defaultSettings = { 
    enabled: true,
    showIndex: false,
    findEnd: false,
    debugMode: false
};

// Initialize settings
function loadSettings() {
    // Initialize with defaults if doesn't exist
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = structuredClone(defaultSettings);
    }
    
    // Ensure all settings exist
    if (extension_settings[extensionName].enabled === undefined) {
        extension_settings[extensionName].enabled = true;
    }
    
    if (extension_settings[extensionName].showIndex === undefined) {
        extension_settings[extensionName].showIndex = false;
    }
    
    if (extension_settings[extensionName].findEnd === undefined) {
        extension_settings[extensionName].findEnd = false;
    }
    
    if (extension_settings[extensionName].debugMode === undefined) {
        extension_settings[extensionName].debugMode = false;
    }
    
    // Update UI if it exists
    const enabledCheckbox = document.querySelector('#ghostfinder_enabled');
    if (enabledCheckbox) {
        enabledCheckbox.checked = extension_settings[extensionName].enabled;
    }
    
    const showIndexCheckbox = document.querySelector('#ghostfinder_show_index');
    if (showIndexCheckbox) {
        showIndexCheckbox.checked = extension_settings[extensionName].showIndex;
    }
    
    const findEndCheckbox = document.querySelector('#ghostfinder_find_end');
    if (findEndCheckbox) {
        findEndCheckbox.checked = extension_settings[extensionName].findEnd;
    }
    
    const debugCheckbox = document.querySelector('#ghostfinder_debug');
    if (debugCheckbox) {
        debugCheckbox.checked = extension_settings[extensionName].debugMode;
    }
    
    log("Settings loaded:", extension_settings[extensionName]);
}

// Find ALL boundary messages from context.chat (includes unloaded)
function findAllBoundaries() {
    const context = getContext();
    const allMessages = context.chat || [];
    const boundaries = [];
    const findEnd = extension_settings[extensionName].findEnd;
    let lastWasHidden = false;
    
    for (let i = 0; i < allMessages.length; i++) {
        const msg = allMessages[i];
        const isHidden = msg.is_system === true;
        
        if (findEnd) {
            // Find LAST unhidden before hidden section (end of boundary)
            if (isHidden && !lastWasHidden && i > 0) {
                boundaries.push(i - 1);
            }
        } else {
            // Find FIRST unhidden after hidden section (start of boundary)
            if (!isHidden && lastWasHidden) {
                boundaries.push(i);
            }
        }
        
        lastWasHidden = isHidden;
    }
    
    log(`Found ${boundaries.length} boundaries (${findEnd ? 'ends' : 'starts'}):`, boundaries);
    return boundaries;
}

// Find the next boundary before current scroll position
function findNextBoundary() {
    const boundaries = findAllBoundaries();
    
    if (boundaries.length === 0) {
        return null;
    }
    
    const scrollTop = $('#chat').scrollTop();
    const chatTop = $('#chat').offset().top;
    
    let currentMesId = null;
    $('#chat .mes').each(function() {
        const messageTop = $(this).offset().top - chatTop + scrollTop;
        if (messageTop >= scrollTop - 10) {
            currentMesId = parseInt($(this).attr('mesid'));
            return false;
        }
    });
    
    if (currentMesId === null) {
        return boundaries[boundaries.length - 1];
    }
    
    for (let i = boundaries.length - 1; i >= 0; i--) {
        if (boundaries[i] < currentMesId) {
            return boundaries[i];
        }
    }
    
    return null;
}

// Jump to a specific boundary message
function jumpToBoundary(mesId) {
    if (mesId === null || mesId === undefined) {
        toastr.info('No boundary found', extensionDisplayName);
        return;
    }
    
    const targetElement = $(`.mes[mesid="${mesId}"]`);
    
    if (targetElement.length > 0) {
        targetElement[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
        toastr.success(`Jumped to message #${mesId}`, extensionDisplayName);
        log(`Jumped to message #${mesId}`);
    } else {
        // Message not loaded - scroll to top to load more messages
        $('#chat').animate({ scrollTop: 0 }, 'smooth');
        toastr.info(`Message #${mesId} not loaded. Scrolled to top - click "Show More Messages" to load earlier messages.`, extensionDisplayName);
        log(`Message #${mesId} not loaded, scrolled to top`);
    }
}

// Update the sidebar panel with boundary list
function updateSidebarPanel() {
    const boundaries = findAllBoundaries();
    const listContainer = $('#ghostfinder_sidebar_list');
    
    if (listContainer.length === 0) {
        log("Sidebar list container not found");
        return;
    }
    
    listContainer.empty();
    
    if (boundaries.length === 0) {
        listContainer.append('<div class="ghostfinder_no_boundaries">No boundaries found</div>');
        log("No boundaries found");
        return;
    }
    
    log(`Updating sidebar with ${boundaries.length} boundaries`);
    
    boundaries.forEach(mesId => {
        const item = $('<div class="ghostfinder_boundary_item menu_button"></div>');
        const ghostIcon = $('<i class="fa-solid fa-ghost ghostfinder_ghost_icon"></i>');
        const text = $('<span></span>').text(`Message #${mesId}`);
        
        item.append(ghostIcon).append(text);
        item.on('click', () => jumpToBoundary(mesId));
        listContainer.append(item);
    });
}

// Toggle sidebar panel
function toggleSidebar() {
    const sidebar = $('#ghostfinder_sidebar');
    
    if (sidebar.hasClass('ghostfinder_open')) {
        sidebar.removeClass('ghostfinder_open');
        log("Sidebar closed");
    } else {
        updateSidebarPanel();
        sidebar.addClass('ghostfinder_open');
        log("Sidebar opened");
    }
}

// Close sidebar
function closeSidebar() {
    $('#ghostfinder_sidebar').removeClass('ghostfinder_open');
    log("Sidebar closed");
}

// Open sidebar panel (for Extensions menu button)
function openSidebar() {
    updateSidebarPanel();
    $('#ghostfinder_sidebar').addClass('ghostfinder_open');
    log("Sidebar opened from menu");
}

// Handle lantern button click
function onLanternClick() {
    log("Lantern button clicked");
    
    // If showIndex is enabled, toggle sidebar instead of jumping
    if (extension_settings[extensionName].showIndex) {
        toggleSidebar();
    } else {
        const nextBoundary = findNextBoundary();
        jumpToBoundary(nextBoundary);
    }
}

// Add Extensions menu button
function addExtensionsMenuButton() {
    // Remove existing button
    $('#ghostfinder_menu_button').remove();
    
    // Select the Extensions dropdown menu
    const $extensions_menu = $('#extensionsMenu');
    if (!$extensions_menu.length) {
        log("Extensions menu not found");
        return;
    }
    
    // Create button element
    const $button = $(`
        <div id="ghostfinder_menu_button" class="list-group-item flex-container flexGap5 interactable" title="Show Boundary Index" tabindex="0">
            <i class="fa-solid fa-ghost"></i>
            <span>Show Boundary Index</span>
        </div>
    `);
    
    // Append to extensions menu
    $button.appendTo($extensions_menu);
    
    // Set click handler
    $button.on('click', openSidebar);
    
    log("Menu button added to Extensions dropdown");
}

// Add lantern button to chat interface
function addLanternButton() {
    if (!extension_settings[extensionName].enabled) {
        $('#ghostfinder_button').remove();
        log("Lantern button removed (extension disabled)");
        return;
    }
    
    if ($('#ghostfinder_button').length > 0) {
        log("Lantern button already exists");
        return;
    }
    
    const findEnd = extension_settings[extensionName].findEnd;
    const tooltipText = findEnd ? 'Find last message before hidden sections' : 'Find previous boundary';
    
    const button = $(`
        <div id="ghostfinder_button" class="interactable" title="${tooltipText}" tabindex="0" role="button">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2 C 9 2, 7 3.5, 7 5 L 7 6 L 17 6 L 17 5 C 17 3.5, 15 2, 12 2 Z"/>
                <path d="M 8 6 L 6 10 C 6 10, 5.5 13, 5.5 15 C 5.5 17, 6 18, 7 19 L 17 19 C 18 18, 18.5 17, 18.5 15 C 18.5 13, 18 10, 18 10 L 16 6 Z"/>
                <path d="M 12 10 C 12 10, 10.5 12, 10.5 14 C 10.5 15.5, 11.2 16.5, 12 16.5 C 12.8 16.5, 13.5 15.5, 13.5 14 C 13.5 12, 12 10, 12 10 Z"/>
                <path d="M 12 11.5 C 12 11.5, 11.2 12.8, 11.2 13.8 C 11.2 14.5, 11.5 15, 12 15 C 12.5 15, 12.8 14.5, 12.8 13.8 C 12.8 12.8, 12 11.5, 12 11.5 Z"/>
                <rect x="7" y="19" width="10" height="3" rx="1"/>
                <circle cx="18.5" cy="20.5" r="1"/>
                <line x1="17.5" y1="20.5" x2="19.5" y2="20.5"/>
            </svg>
        </div>
    `);
    button.on('click', onLanternClick);
    
    $('#rightSendForm').prepend(button);
    
    log("Lantern button added");
}

// Create sidebar panel
function createSidebar() {
    // Check if sidebar is currently open before removing
    const wasOpen = $('#ghostfinder_sidebar').hasClass('ghostfinder_open');
    
    // Remove existing sidebar if any
    $('#ghostfinder_sidebar').remove();
    
    const findEnd = extension_settings[extensionName].findEnd;
    const headerText = findEnd ? 'Last Messages Before Hidden' : 'First Messages After Hidden';
    
    const sidebar = $(`
        <div id="ghostfinder_sidebar" class="ghostfinder_sidebar ${wasOpen ? 'ghostfinder_open' : ''}">
            <div class="ghostfinder_sidebar_header">
                <div>
                    <h3>Boundary Messages</h3>
                    <small class="ghostfinder_mode_text">${headerText}</small>
                </div>
                <div class="ghostfinder_sidebar_controls">
                    <div id="ghostfinder_sidebar_refresh" class="fa-solid fa-rotate interactable" title="Refresh"></div>
                    <div id="ghostfinder_sidebar_close" class="fa-solid fa-circle-xmark interactable" title="Close"></div>
                </div>
            </div>
            <div id="ghostfinder_sidebar_list" class="ghostfinder_sidebar_list"></div>
        </div>
    `);
    
    $('body').append(sidebar);
    
    $('#ghostfinder_sidebar_close').on('click', closeSidebar);
    $('#ghostfinder_sidebar_refresh').on('click', updateSidebarPanel);
    
    // If it was open, update the panel content
    if (wasOpen) {
        updateSidebarPanel();
    }
    
    log("Sidebar created");
}

// Setup event listeners for chat changes
function setupEventListeners() {
    log("Registering event listeners");
    
    // Update when chat changes
    eventSource.on(event_types.CHAT_CHANGED, () => {
        log("CHAT_CHANGED event");
        updateSidebarPanel();
    });
    
    eventSource.on(event_types.MESSAGE_RECEIVED, () => {
        log("MESSAGE_RECEIVED event");
        updateSidebarPanel();
    });
    
    eventSource.on(event_types.MESSAGE_DELETED, () => {
        log("MESSAGE_DELETED event");
        updateSidebarPanel();
    });
    
    eventSource.on(event_types.MESSAGE_EDITED, () => {
        log("MESSAGE_EDITED event");
        updateSidebarPanel();
    });
    
    eventSource.on(event_types.MESSAGE_UPDATED, () => {
        log("MESSAGE_UPDATED event");
        updateSidebarPanel();
    });
    
    eventSource.on(event_types.MESSAGE_SWIPED, () => {
        log("MESSAGE_SWIPED event");
        updateSidebarPanel();
    });
    
    eventSource.on(event_types.CHAT_UPDATED, () => {
        log("CHAT_UPDATED event");
        updateSidebarPanel();
    });
}

// Add MutationObserver to detect hide/unhide operations
function setupHideUnhideObserver() {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) {
        log("Chat container not found for observer");
        return;
    }
    
    // Debounce the update to avoid excessive calls
    let updateTimeout;
    const debouncedUpdate = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            log("Detected hide/unhide operation");
            updateSidebarPanel();
        }, 100);
    };
    
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Check if is_system attribute changed on any message
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'is_system' &&
                mutation.target.classList.contains('mes')) {
                debouncedUpdate();
                break;
            }
        }
    });
    
    observer.observe(chatContainer, {
        attributes: true,
        attributeFilter: ['is_system'],
        subtree: true
    });
    
    log("Hide/unhide observer started");
}

// Handle enabled toggle
function onEnabledChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    info(`Extension ${value ? 'enabled' : 'disabled'}`);
    
    addLanternButton();
    addExtensionsMenuButton();
    createSidebar();
}

// Handle show index toggle
function onShowIndexChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].showIndex = value;
    saveSettingsDebounced();
    info(`Show index panel ${value ? 'enabled' : 'disabled'}`);
    
    createSidebar();
    
    // Update button tooltip
    if (value) {
        $('#ghostfinder_button').attr('title', 'Show boundary index');
    } else {
        const findEnd = extension_settings[extensionName].findEnd;
        const tooltipText = findEnd ? 'Find last message before hidden sections' : 'Find previous boundary';
        $('#ghostfinder_button').attr('title', tooltipText);
    }
}

// Handle find end toggle
function onFindEndChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].findEnd = value;
    saveSettingsDebounced();
    info(`Find end mode ${value ? 'enabled' : 'disabled'}`);
    
    updateSidebarPanel();
    createSidebar();
    
    // Update button tooltip
    const tooltipText = value ? 'Find last message before hidden sections' : 'Find previous boundary';
    $('#ghostfinder_button').attr('title', tooltipText);
}

// Handle debug mode toggle
function onDebugModeChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].debugMode = value;
    saveSettingsDebounced();
    info(`Debug mode ${value ? 'enabled' : 'disabled'}`);
}

// Initialize the extension
async function init() {
    info("Initializing...");
    
    loadSettings();
    
    // Load settings UI
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings2").append(settingsHtml);
        
        // Bind event handlers
        $("#ghostfinder_enabled").on("change", onEnabledChange);
        $("#ghostfinder_show_index").on("change", onShowIndexChange);
        $("#ghostfinder_find_end").on("change", onFindEndChange);
        $("#ghostfinder_debug").on("change", onDebugModeChange);
        
        // Update checkbox states
        $("#ghostfinder_enabled").prop("checked", extension_settings[extensionName].enabled);
        $("#ghostfinder_show_index").prop("checked", extension_settings[extensionName].showIndex);
        $("#ghostfinder_find_end").prop("checked", extension_settings[extensionName].findEnd);
        $("#ghostfinder_debug").prop("checked", extension_settings[extensionName].debugMode);
        
        log("Settings UI loaded");
    } catch (error) {
        console.error(`[${extensionDisplayName}] Failed to load settings UI:`, error);
    }
    
    // Wait a bit for ST to load UI elements
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set up components
    addLanternButton();
    addExtensionsMenuButton();
    createSidebar();
    setupEventListeners();
    setupHideUnhideObserver();
    
    log("Initialization complete");
}

// Register the extension
jQuery(async () => {
    await init();
});
