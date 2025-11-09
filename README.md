# Ghostfinder

A SillyTavern extension that helps you navigate between "boundary messages" - the first unhidden messages that appear after hidden or system messages in your chat.

## What are Boundary Messages?

When you hide messages in SillyTavern (system messages, swipes, etc.), "boundary messages" are the first visible messages that come after those hidden sections. Ghostfinder helps you quickly navigate to these boundaries, making it easy to jump between different conversation segments.

## Why Ghostfinder?

Hidden messages are denoted with a ghost icon. I thought this would be cute.

## Features

### 🕯 Lantern Button (Default Mode)

A lantern button appears in your chat interface. Click it to:

1. **Jump to previous boundary** - Scrolls to the most recent boundary message before your current position
2. **Click again** to find earlier boundaries - Each click takes you to the next boundary up in the conversation
3. **Pagination aware** - If there are boundaries in messages that aren't loaded yet (beyond SillyTavern's default 100-message limit), you'll get a notification to scroll up and load more messages

### 📋 Boundary Panel (Optional)

Enable "Show Boundary Panel" in the extension settings to change the lantern button's behavior:

- **Click the lantern** to open a sidebar panel showing *all* boundary messages in the current chat
- **Click any message number** in the panel to jump directly to that boundary
- The panel stays open as you navigate, so you can jump between multiple boundaries easily
- **Close button** in the top-right corner of the panel

## Installation

1. Open SillyTavern
2. Go to Extensions → Install Extension
3. Paste the GitHub URL: `https://github.com/sakanomichi/SillyTavern-Ghostfinder`
4. Refresh the page

Or manually place the extension folder in:
```
public/scripts/extensions/third-party/SillyTavern-Ghostfinder/
```

## Settings

Find Ghostfinder in the Extensions panel (right sidebar):

- **Enable Ghostfinder** - Turns the extension on/off
- **Show Boundary Panel** - When enabled, the lantern button opens a panel listing all boundaries instead of jumping to the previous one

## Use Cases

- Quickly jump back to the last hidden message in your conversation
- Find any hidden messages you missed deeper or earlier in the chat
- Navigate back to boundary points after using `/hide` or `/unhide` commands on a range of messages

## Credits

Created by sakanomichi using tools created by cha1latte
