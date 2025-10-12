
Implement hierarchical linking and creation for C4 model diagrams.  
When a user clicks a node on a diagram (Context, Container, or Component), enable them to either link to an existing lower-level diagram or create a new sub-diagram and node, as follows:

### Node Interaction Logic:

- **On Node Click:**  
  - If in a Context Diagram and a System node is selected:  
    - In Properties Panel, show a “Linked Container Diagram” dropdown.
      - Populate this dropdown with all existing Container diagrams and their main nodes (if already defined).
      - Include an additional `[New Container]` option at the end.
    - If the user chooses an existing diagram, immediately link the selected system node to the chosen container diagram and persist the relationship in the model.
    - If `[New Container]` is chosen, prompt the user to create the new diagram (with a name/label dialog), auto-link it, and switch context to the new diagram for further editing.

  - If in a Container Diagram and a Component node is selected:  
    - In Properties Panel, show a “Linked Component Diagram” dropdown.
      - Populate dropdown with all existing Component diagrams and their primary nodes.
      - Include `[New Component]` as an option at the end.
    - If the user selects an existing diagram, link the chosen component node to that component diagram.
    - If `[New Component]` is chosen, create a new component diagram, link it, and open it for the user.

- **If a link already exists:**  
  - Indicate the linked diagram in the properties and allow users to re-link to another, or create a new one.

- **User interactions should never break the model:**
  - All links and diagram relationships must be tracked and updated in the program’s data layer/state.
  - Prevent duplicate links to the same lower-level diagram from a single node.
  - Validate before overwriting any link, with a “Warning: Changing the linked diagram will break existing relationships with this node. Continue?” dialog.

### Additional Requirements:

- **Dropdown content:** Each linked diagram or node in the dropdown should display a label and type, e.g., ‘Payments Container [Container Diagram]’ or ‘AuthService Component [Component Diagram]’.
- **New creation modal:** When `[New Container]` or `[New Component]` is selected, show a modal dialog to capture name and optionally description.
- **Persist relationship:** After linking or creating, persist the association in both the source node and the destination diagram.
- **Navigation:** After linking/creation, provide a shortcut or button to “Open [Target Diagram]” for immediate switch.
- **Consistency:** All lower-level creation flows (Context→Container, Container→Component) should follow this same pattern.
- **Extensibility:** Design logic so that future C4 diagram types or deeper nesting can be added as needed.

**Summary of core steps:**
1. User clicks node.
2. Properties panel shows dropdown of lower-level diagrams/nodes, plus `[New …]` at end.
3. Selection of an existing links node. Selection of `[New …]` prompts for creation, auto-links after.
4. Model/state tracks and persists all hierarchy changes.
5. User warned before overwriting a link.
6. Navigation and UI feedback always available for the linked diagram.
