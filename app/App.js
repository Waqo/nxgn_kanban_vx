// ==========================================
// App Initialization (app/App.js)
// ==========================================

// Import Core Dependencies
import store from './store/store.js';
import WidgetView from './views/WidgetView.js';
import ZohoAPIService from './services/zohoCreatorAPI.js';

// Import Component Definitions
import KanbanCard from './components/kanban/KanbanCard.js';
import KanbanColumn from './components/kanban/KanbanColumn.js';
import KanbanToolbar from './components/kanban/KanbanToolbar.js';
import KanbanBoard from './components/kanban/KanbanBoard.js';
import DevToolbar from './components/kanban/DevToolbar.js';
import BaseToggle from './components/common/BaseToggle.js';
import BaseButton from './components/common/BaseButton.js';
import BaseBadge from './components/common/BaseBadge.js';
import BaseSelectMenu from './components/common/BaseSelectMenu.js';
import BaseDropdown from './components/common/BaseDropdown.js';
import BaseCombobox from './components/common/BaseCombobox.js';
import BaseButtonGroup from './components/common/BaseButtonGroup.js';
import BaseModal from './components/common/BaseModal.js';
import BaseCard from './components/common/BaseCard.js';
import BaseAvatar from './components/common/BaseAvatar.js';
import BaseListContainer from './components/common/BaseListContainer.js';
import BaseTabs from './components/common/BaseTabs.js';
import BaseAlert from './components/common/BaseAlert.js';
import BaseTextArea from './components/common/BaseTextArea.js';
import BaseNotification from './components/common/BaseNotification.js';
import BaseFeed from './components/common/BaseFeed.js';
import BaseGridList from './components/common/BaseGridList.js';
import BaseTable from './components/common/BaseTable.js';
import BaseStackedList from './components/common/BaseStackedList.js';
import BaseDescriptionList from './components/common/BaseDescriptionList.js';
import BaseTextInput from './components/common/BaseTextInput.js';
import KanbanBoardSkeleton from './components/kanban/KanbanBoardSkeleton.js';

// 1. --- CREATE VUE APP INSTANCE ---
const app = Vue.createApp(WidgetView);

// 2. --- INSTALL PLUGINS (VUEX STORE) ---
app.use(store);

// 3. --- REGISTER GLOBAL COMPONENTS ---
console.log('Registering global components...');

// Kanban Components
app.component('KanbanCard', KanbanCard);
app.component('KanbanColumn', KanbanColumn);
app.component('KanbanToolbar', KanbanToolbar);
app.component('KanbanBoard', KanbanBoard);
app.component('DevToolbar', DevToolbar);
app.component('KanbanBoardSkeleton', KanbanBoardSkeleton);

// Common Components
app.component('BaseToggle', BaseToggle);
app.component('BaseButton', BaseButton);
app.component('BaseBadge', BaseBadge);
app.component('BaseSelectMenu', BaseSelectMenu);
app.component('BaseDropdown', BaseDropdown);
app.component('BaseCombobox', BaseCombobox);
app.component('BaseButtonGroup', BaseButtonGroup);
app.component('BaseModal', BaseModal);
app.component('BaseCard', BaseCard);
app.component('BaseAvatar', BaseAvatar);
app.component('BaseListContainer', BaseListContainer);
app.component('BaseTabs', BaseTabs);
app.component('BaseAlert', BaseAlert);
app.component('BaseTextArea', BaseTextArea);
app.component('BaseNotification', BaseNotification);
app.component('BaseFeed', BaseFeed);
app.component('BaseGridList', BaseGridList);
app.component('BaseTable', BaseTable);
app.component('BaseStackedList', BaseStackedList);
app.component('BaseDescriptionList', BaseDescriptionList);
app.component('BaseTextInput', BaseTextInput);

// 5. --- GLOBAL PROPERTIES ---
app.config.globalProperties.$api = ZohoAPIService;

// 6. --- MOUNT THE APPLICATION ---
app.mount('#app');
console.log('Vue App Initialized, Store installed, Global Components registered, App Mounted.');