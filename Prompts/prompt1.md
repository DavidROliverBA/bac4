"Add functionality to let the user switch the current diagram between different C4 Model types (Context, Container, Component) via a selection control (e.g. dropdown) in the main diagram UI.

Before allowing the diagram type to switch, check if the current diagram is not empty. If there are any existing elements, prompt the user with a warning message:
'Warning: Switching diagram type will clear all current elements. This action cannot be undone. Continue?'
Provide 'Cancel' and 'Continue' options. Only proceed with the switch if the user confirms.

On confirm, clear the current diagram, switch to the chosen C4 Model type, and update all related program dependencies to reflect the new model type—this includes updating state, type definitions, and component logic so all dependent parts of the app respond to the new diagram type.

Requirements:

UI control for switching between Context, Container, and Component diagrams, visible at all times.

Warning dialog appears only if the current diagram has elements (not empty).

Dependencies, state, and type logic consistently update on diagram type change.

User returns to a blank diagram of the new type after switching.

Prevent loss of data without user consent."