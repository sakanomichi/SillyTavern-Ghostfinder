import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "SillyTavern-Ghostfinder";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = { 
    enabled: true,
    showIndex: true
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
        const item = $('<div class="ghostfinder_boundary_item menu_button"></div>')
            .text(`Message #${mesId}`)
            .on('click', () => jumpToBoundary(mesId));
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
    console.log(`[${extensionName}] Candle button clicked`);
    
    // If showIndex is enabled, toggle sidebar instead of jumping
    if (extension_settings[extensionName].showIndex) {
        toggleSidebar();
    } else {
        const nextBoundary = findNextBoundary();
        jumpToBoundary(nextBoundary);
    }
}

function addLanternButton() {
    if (!extension_settings[extensionName].enabled) {
        $('#ghostfinder_button').remove();
        return;
    }
    
    if ($('#ghostfinder_button').length > 0) return;
    
    const button = $('<div id="ghostfinder_button" class="fa-solid fa-candle interactable" title="Find previous boundary" tabindex="0"></div>');
    button.on('click', onLanternClick);
    
    $('#rightSendForm').prepend(button);
    
    console.log(`[${extensionName}] Candle button added`);
}

// Create sidebar panel
function createSidebar() {
    // Remove existing sidebar if any
    $('#ghostfinder_sidebar').remove();
    
    if (!extension_settings[extensionName].enabled || !extension_settings[extensionName].showIndex) {
        return;
    }
    
    const sidebar = $(`
        <div id="ghostfinder_sidebar" class="ghostfinder_sidebar">
            <div class="ghostfinder_sidebar_header">
                <h3>Boundary Messages</h3>
                <div id="ghostfinder_sidebar_close" class="fa-solid fa-circle-xmark" title="Close"></div>
            </div>
            <div id="ghostfinder_sidebar_list" class="ghostfinder_sidebar_list"></div>
        </div>
    `);
    
    $('body').append(sidebar);
    
    $('#ghostfinder_sidebar_close').on('click', closeSidebar);
    
    // Update when chat changes
    eventSource.on(event_types.CHAT_CHANGED, updateSidebarPanel);
    eventSource.on(event_types.MESSAGE_RECEIVED, updateSidebarPanel);
    eventSource.on(event_types.MESSAGE_DELETED, updateSidebarPanel);
    eventSource.on(event_types.MESSAGE_EDITED, updateSidebarPanel);
    
    console.log(`[${extensionName}] Sidebar created`);
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
        createSidebar();
       
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Error:`, error);
    }
});