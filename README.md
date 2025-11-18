# Ghostfinder

A SillyTavern extension that helps you navigate between "boundary messages" - the first unhidden messages that appear after hidden or system messages in your chat.

## What are Boundary Messages?

When you hide messages in SillyTavern (system messages, OOC messages, swipes, etc.), "boundary messages" are the first visible messages that come after those hidden sections. Ghostfinder helps you quickly navigate to these boundaries, making it easy to jump between different conversation segments.

## Why Ghostfinder?

Hidden messages are denoted with a ghost icon. I thought a ghostfinding lantern would be cute. 👻

## Features

### 🕯️ Lantern Button

A lantern button appears in your chat interface. **By default**, clicking it will:

1. **Jump to previous boundary** - Scrolls to the most recent boundary message before your current position
2. **Click again** to find earlier boundaries - Each click takes you to the next boundary up in the conversation
3. **Pagination aware** - If there are boundaries in messages that aren't loaded yet, the button will scroll to the top of the chat so you can click "Show More Messages" to load them

### 👻 Boundary Index Panel

Access the panel via:
- **Extensions menu** - Click the "Show Boundary Index" button (always available)
- **Lantern button** - Enable "Lantern Button Opens Panel" in settings to change the lantern button's behaviour

The panel features:
- **Complete list** of all boundary messages in the current chat (including unloaded messages beyond pagination)
- **Click any message number** to jump directly to that boundary
- **Refresh button** to manually update the list after hide/unhide operations
- **Auto-updates** when messages are added, deleted, edited, or hidden/unhidden (for loaded messages)
- Panel stays open while you navigate, making it easy to jump between multiple boundaries

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

- **Show Lantern Button** - Display the lantern button in the chat interface (on by default)
- **Lantern Button Opens Panel** - When enabled, clicking the lantern button opens the Boundary Index Panel. When disabled, clicking jumps to the previous boundary (off by default)
- **Find End of Sections** - Find the last visible message before each hidden section, instead of the first visible message after each hidden section (off by default)
- **Enable Debug Logging** - Shows detailed information in the browser console for troubleshooting (off by default)

**Note:** The Boundary Index Panel is always accessible via the Extensions menu, regardless of these settings.

## Use Cases

- Quickly jump back to the last hidden message in your conversation
- Find any hidden messages you missed deeper or earlier in the chat
- Navigate back to boundary points after using `/hide` or `/unhide` commands on a range of messages
- Review all conversation segments at a glance using the panel
- Efficiently navigate long roleplays with many hidden system messages or swipes

## Troubleshooting

If the extension isn't working:

1. Open the browser console (F12) and look for `[Ghostfinder]` messages
2. Enable debug logging in the extension settings
3. Verify all files are in the correct directory
4. Try clearing your browser cache

## Tips

- Use the **refresh button** in the panel after hiding/unhiding messages beyond pagination
- Access the panel from the **Extensions menu** even when the lantern button is hidden
- The panel shows **all** boundaries (even unloaded ones), while the lantern button navigates through loaded boundaries
- Enable **debug logging** to see detailed information about boundary detection and navigation

## Credits

Created by sakanomichi using tools created by Chai/Ultraviolenc!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and detailed changes.

## License

GPL-3.0 - See [LICENSE](LICENSE) file for details.
