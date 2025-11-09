import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "SillyTavern-Ghostfinder";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = { 
    enabled: true,
    showIndex: false
};

// Find ALL boundary messages from context.chat (includes unloaded)
function findAllBoundaries() {
    const context = getContext();
    const allMessages = context.chat || [];
    const boundaries = [];
    let lastWasHidden = false;
    
    for (let i = 0; i < allMessages.length; i++) {
        const msg = allMessages[i];
        const isHidden = msg.is_system === true;
        
        if (!isHidden && lastWasHidden) {
            boundaries.push(i);
        }
        
        lastWasHidden = isHidden;
    }
    
    console.log(`[${extensionName}] Found ${boundaries.length} boundaries (all):`, boundaries);
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

function jumpToBoundary(mesId) {
    if (mesId === null || mesId === undefined) {
        toastr.info('No boundary found', 'Ghostfinder');
        return;
    }
    
    const targetElement = $(`.mes[mesid="${mesId}"]`);
    
    if (targetElement.length > 0) {
        targetElement[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
        toastr.success(`Jumped to message #${mesId}`, 'Ghostfinder');
    } else {
        toastr.warning(`Message #${mesId} not loaded. Scroll up to load more messages.`, 'Ghostfinder');
    }
}

// Update the sidebar panel with boundary list
function updateSidebarPanel() {
    const boundaries = findAllBoundaries();
    const listContainer = $('#ghostfinder_sidebar_list');
    
    if (listContainer.length === 0) return;
    
    listContainer.empty();
    
    if (boundaries.length === 0) {
        listContainer.append('<div class="ghostfinder_no_boundaries">No boundaries found</div>');
        return;
    }
    
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
    } else {
        updateSidebarPanel();
        sidebar.addClass('ghostfinder_open');
    }
}

// Close sidebar
function closeSidebar() {
    $('#ghostfinder_sidebar').removeClass('ghostfinder_open');
}

function onLanternClick() {
    console.log(`[${extensionName}] Lantern button clicked`);
    
    // If showIndex is enabled, toggle sidebar instead of jumping
    if (extension_settings[extensionName].showIndex) {
        toggleSidebar();
    } else {
        const nextBoundary = findNextBoundary();
        jumpToBoundary(nextBoundary);
    }
}

// Open sidebar panel (for Extensions menu button)
function openSidebar() {
    updateSidebarPanel();
    $('#ghostfinder_sidebar').addClass('ghostfinder_open');
}

function addExtensionsMenuButton() {
    // Remove existing button
    $('#ghostfinder_menu_button').remove();
    
    // Don't check enabled setting - always add menu button
    
    // Select the Extensions dropdown menu
    const $extensions_menu = $('#extensionsMenu');
    if (!$extensions_menu.length) {
        console.log(`[${extensionName}] Extensions menu not found`);
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
    
    console.log(`[${extensionName}] Menu button added to Extensions dropdown`);
}

function addLanternButton() {
    if (!extension_settings[extensionName].enabled) {
        $('#ghostfinder_button').remove();
        return;
    }
    
    if ($('#ghostfinder_button').length > 0) return;
    
    const button = $(`
        <div id="ghostfinder_button" class="interactable" title="Find previous boundary" tabindex="0" role="button">
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
    
    console.log(`[${extensionName}] Lantern button added`);
}

function createSidebar() {
    // Remove existing sidebar if any
    $('#ghostfinder_sidebar').remove();
    
    // Always create sidebar - don't check enabled setting
    
    const sidebar = $(`
        <div id="ghostfinder_sidebar" class="ghostfinder_sidebar">
            <div class="ghostfinder_sidebar_header">
                <h3>Boundary Messages</h3>
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
    
    // Update when chat changes
    eventSource.on(event_types.CHAT_CHANGED, updateSidebarPanel);
    eventSource.on(event_types.MESSAGE_RECEIVED, updateSidebarPanel);
    eventSource.on(event_types.MESSAGE_DELETED, updateSidebarPanel);
    eventSource.on(event_types.MESSAGE_EDITED, updateSidebarPanel);
    
    console.log(`[${extensionName}] Panel created`);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
   
    try {
        if (!extension_settings[extensionName]) {
            extension_settings[extensionName] = Object.assign({}, defaultSettings);
        }
        console.log(`[${extensionName}] Settings initialized:`, extension_settings[extensionName]);
       
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings2").append(settingsHtml);
        console.log(`[${extensionName}] HTML appended`);
       
        $("#ghostfinder_enabled").on("change", function() {
            const value = $(this).prop("checked");
            extension_settings[extensionName].enabled = value;
            saveSettingsDebounced();
            addLanternButton();
            addExtensionsMenuButton(); // Add this line
            createSidebar();
        });
        
        $("#ghostfinder_show_index").on("change", function() {
            const value = $(this).prop("checked");
            extension_settings[extensionName].showIndex = value;
            saveSettingsDebounced();
            createSidebar();
            
            // Update button tooltip
            if (value) {
                $('#ghostfinder_button').attr('title', 'Show boundary index');
            } else {
                $('#ghostfinder_button').attr('title', 'Find previous boundary');
            }
        });
        
        $("#ghostfinder_enabled").prop("checked", extension_settings[extensionName].enabled);
        $("#ghostfinder_show_index").prop("checked", extension_settings[extensionName].showIndex);
        
        addLanternButton();
        addExtensionsMenuButton();
        createSidebar();
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Error:`, error);
    }
});
