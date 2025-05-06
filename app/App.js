// ==========================================
// App Initialization (app/App.js)
// ==========================================

// Import Core Dependencies
// import store from './store/store.js'; // REMOVE Vuex Store Import
import WidgetView from './views/WidgetView.js';
import ZohoAPIService from './services/zohoCreatorAPI.js';
import { initializeApp } from './services/initService.js'; // IMPORT Initialization Service
// --- ADD Error Log Service Import ---
import { logErrorToZoho } from './services/errorLogService.js';
import { useNotificationsStore } from './store/notificationsStore.js'; // Import notification store
const { onUnmounted } = Vue; // Import onUnmounted from global Vue

// --- REMOVE Import for non-Base Kanban Components ---
// import KanbanCard from './components/kanban/KanbanCard.js';
// import KanbanColumn from './components/kanban/KanbanColumn.js';
// import KanbanToolbar from './components/kanban/KanbanToolbar.js';
// import KanbanBoard from './components/kanban/KanbanBoard.js';
// import DevToolbar from './components/kanban/DevToolbar.js';
// import KanbanBoardSkeleton from './components/kanban/KanbanBoardSkeleton.js';

// Import Base Component Definitions (Keep These)
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

// --- REMOVE Import for Modal and Tab Components ---
// import ProjectDetailModal from './components/modal/ProjectDetailModal.js';
// import ModalHeader from './components/modal/ModalHeader.js';
// import OverviewTab from './components/modal/tabs/overview/OverviewTab.js';
// import ContactsTab from './components/modal/tabs/contacts/ContactsTab.js';
// import DocumentsTab from './components/modal/tabs/documents/DocumentsTab.js';
// import SurveyTab from './components/modal/tabs/survey/SurveyTab.js';
// import SystemsTab from './components/modal/tabs/systems/SystemsTab.js';
// import TasksTab from './components/modal/tabs/tasks/TasksTab.js';
// import PermittingTab from './components/modal/tabs/permitting/PermittingTab.js';
// import CommissionsTab from './components/modal/tabs/commissions/CommissionsTab.js';
// import PropertyInfoTab from './components/modal/tabs/propertyInfo/PropertyInfoTab.js';
// import ActivityTab from './components/modal/tabs/activity/ActivityTab.js';
// import CommunicationsTab from './components/modal/tabs/communications/CommunicationsTab.js';
// import InvestorsTab from './components/modal/tabs/investors/InvestorsTab.js';

// 1. --- CREATE VUE APP INSTANCE ---
const app = Vue.createApp(WidgetView);

// 2. --- INSTALL PLUGINS (PINIA STORE) ---
// app.use(store); // REMOVE Vuex Store Registration
const { createPinia } = Pinia; 
const pinia = createPinia();
app.use(pinia); // Ensure Pinia is registered BEFORE initialization call
// console.log('Pinia Instance Registered:', pinia);

// Instantiate notification store *after* Pinia is used
// No need to instantiate it here globally unless other parts of App.js need it directly
// const notificationsStore = useNotificationsStore();

// --- CALL INITIALIZATION SERVICE ---
initializeApp(); // Call the initialization function

// 3. --- REGISTER GLOBAL COMPONENTS ---
// console.log('Registering global components...');
// console.log('VueUse Install Status:', VueUse);

// --- REMOVE Kanban Components Registration ---
// app.component('KanbanCard', KanbanCard);
// app.component('KanbanColumn', KanbanColumn);
// app.component('KanbanToolbar', KanbanToolbar);
// app.component('KanbanBoard', KanbanBoard);
// app.component('DevToolbar', DevToolbar);
// app.component('KanbanBoardSkeleton', KanbanBoardSkeleton);

// Common Components (Keep These Global)
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
// --- CORRECT VueDatePicker Registration (Uses Global from CDN) ---
app.component('VueDatePicker', VueDatePicker);
// Keep Base* components registered

// 5. --- GLOBAL PROPERTIES ---
app.config.globalProperties.$api = ZohoAPIService;

// --- ADD Global Error Handler ---
app.config.errorHandler = (err, instance, info) => {
  console.error("Global Error Handler Caught:", err, instance, info); // Keep console log for debugging

  // --- Prepare Context ---
  const context = {
    vueInfo: info, // e.g., lifecycle hook name
    componentName: instance?.$options?.name || 'Unknown Component',
    // Optionally add props or simplified state if safe and useful
    // componentProps: instance?.$props ? JSON.stringify(instance.$props) : '{}',
  };

  // --- Call Logging Service --- 
  // Run async but don't await (fire and forget)
  logErrorToZoho(err, context);
};

// --- REMOVE Modal and Tab Component Registrations ---
// app.component('ProjectDetailModal', ProjectDetailModal);
// app.component('ModalHeader', ModalHeader);
// app.component('OverviewTab', OverviewTab);
// app.component('ContactsTab', ContactsTab);
// app.component('DocumentsTab', DocumentsTab);
// app.component('SurveyTab', SurveyTab);
// app.component('SystemsTab', SystemsTab);
// app.component('TasksTab', TasksTab);
// app.component('PermittingTab', PermittingTab);
// app.component('CommissionsTab', CommissionsTab);
// app.component('PropertyInfoTab', PropertyInfoTab);
// app.component('ActivityTab', ActivityTab);
// app.component('CommunicationsTab', CommunicationsTab);
// app.component('InvestorsTab', InvestorsTab);

// 6. --- MOUNT THE APPLICATION ---
app.mount('#app');
// console.log('Vue App Initialized, Pinia installed, Global Components registered, App Mounted.');