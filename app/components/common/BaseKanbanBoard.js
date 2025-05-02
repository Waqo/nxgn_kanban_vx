const { ref, computed } = Vue;

export default {
  name: 'BaseKanbanBoard',
  props: {
    // Array of column objects (e.g., stages). Expected: { id: String|Number, title: String, ...rest }
    columns: {
      type: Array,
      required: true,
      default: () => [],
    },
    // Array of item objects (e.g., projects). Expected: { id: String|Number, columnId: String|Number, ...rest }
    items: {
      type: Array,
      required: true,
      default: () => [],
    },
    // Key to use for identifying columns
    columnKey: {
      type: String,
      default: 'id',
    },
    // Key to use for identifying items
    itemKey: {
      type: String,
      default: 'id',
    },
    // Key on items that references the column's key
    itemColumnKey: {
      type: String,
      default: 'columnId', // Adjust based on your item data structure (e.g., 'stageId')
    },
    // Optional styling variant
    variant: {
      type: String,
      default: 'default', // e.g., 'default', 'compact'
    },
    // Loading state
    isLoading: {
      type: Boolean,
      default: false,
    },
    // Message when no columns or items exist
    emptyMessage: {
      type: String,
      default: 'No items to display.',
    },
    // Allow adding items within columns
    allowAddItem: {
      type: Boolean,
      default: false,
    },
    // Class for the main board container
    boardClass: {
      type: String,
      default: 'flex overflow-x-auto space-x-4 p-4 bg-gray-100 h-full',
    },
    // Class for individual columns
    columnClass: {
      type: String,
      default: 'flex-shrink-0 w-72 bg-gray-50 rounded-md shadow-sm p-3',
    },
    // Class for column header
    columnHeaderClass: {
      type: String,
      default: 'text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200 flex justify-between items-center',
    },
    // Class for the list of items within a column
    itemListClass: {
      type: String,
      default: 'space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]', // Adjust max-height as needed
    },
     // Additional class for columns when dragging over them
    dragOverClass: {
      type: String,
      default: 'bg-blue-50 ring-2 ring-blue-300',
    }
  },
  emits: [
    'item-drop', // { itemId, newColumnId, oldColumnId }
    'item-click', // item
    'column-header-click', // column
    'add-item-click', // columnId
  ],
  setup(props, { emit }) {
    const draggedItemId = ref(null);
    const draggedItemColumnId = ref(null);
    const dragOverColumnId = ref(null); // Track column being dragged over

    // Group items by their respective column IDs
    const itemsByColumn = computed(() => {
      const grouped = {};
      // Initialize columns
      props.columns.forEach(col => {
        grouped[col[props.columnKey]] = [];
      });
      // Populate with items
      props.items.forEach(item => {
        const colId = item[props.itemColumnKey];
        if (grouped[colId]) {
          grouped[colId].push(item);
        } else {
          // console.warn(`Item ${item[props.itemKey]} has unknown columnId: ${colId}`);
          // Optionally place in a default "unassigned" column if needed
        }
      });
      return grouped;
    });

    // --- Drag and Drop Handlers ---

    const handleDragStart = (item) => {
      const itemId = item[props.itemKey];
      const itemColumnId = item[props.itemColumnKey];
      console.log(`Drag Start: Item ID = ${itemId}, Column ID = ${itemColumnId}`);
      draggedItemId.value = itemId;
      draggedItemColumnId.value = itemColumnId;
      // Use 'text/plain' for broad compatibility
      event.dataTransfer.setData('text/plain', itemId);
      event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (event, columnId) => {
       event.preventDefault(); // Necessary to allow dropping
       dragOverColumnId.value = columnId;
       event.dataTransfer.dropEffect = 'move';
    };
    
    const handleDragLeave = (event, columnId) => {
        // Remove highlight if leaving the column area completely
        if (dragOverColumnId.value === columnId) {
             dragOverColumnId.value = null;
        }
    };

    const handleDrop = (event, newColumnId) => {
      event.preventDefault();
      const itemId = event.dataTransfer.getData('text/plain');
      const oldColumnId = draggedItemColumnId.value; // Get from state set during drag start
      
      console.log(`Drop: Item ID = ${itemId}, New Column ID = ${newColumnId}, Old Column ID = ${oldColumnId}`);

      // Only emit if the column is different and we have all info
      if (itemId && newColumnId !== null && oldColumnId !== null && newColumnId !== oldColumnId) {
        emit('item-drop', { itemId, newColumnId, oldColumnId });
      } else if (newColumnId === oldColumnId) {
         console.log("Item dropped in the same column, no event emitted.");
      } else {
          console.warn("Drop event occurred but missing data:", { itemId, newColumnId, oldColumnId });
      }

      // Reset drag state
      draggedItemId.value = null;
      draggedItemColumnId.value = null;
      dragOverColumnId.value = null;
    };

    const handleDragEnd = () => {
      console.log("Drag End");
      // Reset drag state if drop didn't occur (e.g., dropped outside valid target)
      draggedItemId.value = null;
      draggedItemColumnId.value = null;
      dragOverColumnId.value = null;
    };

    // --- Click Handlers ---

    const handleItemClick = (item) => {
      emit('item-click', item);
    };

    const handleColumnHeaderClick = (column) => {
      emit('column-header-click', column);
    };

    const handleAddItemClick = (columnId) => {
      emit('add-item-click', columnId);
    };

    return {
      itemsByColumn,
      handleDragStart,
      handleDragOver,
      handleDragLeave, // Add leave handler
      handleDrop,
      handleDragEnd,
      handleItemClick,
      handleColumnHeaderClick,
      handleAddItemClick,
      dragOverColumnId, // Expose for dynamic class binding
      draggedItemId, // Expose currently dragged item ID
    };
  },
  template: `
    <div :class="boardClass">
      <div v-if="isLoading" class="flex items-center justify-center w-full h-full text-gray-500">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <span class="ml-2">Loading board...</span>
      </div>

      <div v-else-if="!columns.length" class="flex items-center justify-center w-full h-full text-gray-500">
        {{ emptyMessage }}
      </div>

      <!-- Columns -->
      <div
        v-else
        v-for="column in columns"
        :key="column[columnKey]"
        :class="[
            columnClass,
            dragOverColumnId === column[columnKey] ? dragOverClass : '' // Apply highlight class
        ]"
        @dragover.prevent="event => handleDragOver(event, column[columnKey])"
        @dragleave="event => handleDragLeave(event, column[columnKey])" // Add leave handler
        @drop.prevent="event => handleDrop(event, column[columnKey])"
      >
        <!-- Column Header -->
        <div :class="columnHeaderClass">
          <slot name="column-header" :column="column">
            <span class="truncate cursor-pointer hover:text-blue-600" @click="handleColumnHeaderClick(column)">
              {{ column.title || 'Unnamed Column' }}
              <span class="text-xs text-gray-400 ml-1">({{ itemsByColumn[column[columnKey]]?.length || 0 }})</span>
            </span>
          </slot>
          <slot name="column-actions" :column="column">
              <!-- Placeholder for actions like settings icon -->
          </slot>
        </div>

        <!-- Item List -->
        <div :class="itemListClass">
          <div
            v-for="item in itemsByColumn[column[columnKey]]"
            :key="item[itemKey]"
            :draggable="true"
            @dragstart="event => handleDragStart(item, event)"
            @dragend="handleDragEnd"
            :class="[
              'kanban-item cursor-pointer',
              item[itemKey] === draggedItemId ? 'opacity-50' : '' // Style the card being dragged
            ]"
            @click="handleItemClick(item)"
          >
            <slot name="item" :item="item" :column="column">
              <!-- Default Item Rendering -->
              <div class="bg-white p-3 rounded shadow-xs border border-gray-200">
                <p class="text-sm font-medium">{{ item.name || 'Unnamed Item' }}</p>
                <p v-if="item.description" class="text-xs text-gray-500 mt-1 truncate">{{ item.description }}</p>
                <pre class="text-xs mt-2 bg-gray-50 p-1 rounded overflow-auto">{{ JSON.stringify(item, null, 2) }}</pre>
              </div>
            </slot>
          </div>

           <!-- Empty Column Message -->
           <div v-if="!itemsByColumn[column[columnKey]] || itemsByColumn[column[columnKey]].length === 0" class="text-center text-xs text-gray-400 py-4 italic">
             No items in this stage.
           </div>
        </div>

        <!-- Add Item Button/Slot -->
        <div v-if="allowAddItem" class="mt-3 pt-3 border-t border-gray-200">
          <slot name="add-item-button" :column="column">
            <button
              @click="handleAddItemClick(column[columnKey])"
              class="w-full text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded py-1 px-2 transition-colors duration-150 flex items-center justify-center gap-1"
            >
              <i class="fas fa-plus text-xs"></i> Add Item
            </button>
          </slot>
        </div>
      </div>
    </div>
  `
}; 