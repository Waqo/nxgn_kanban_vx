// app/components/modal/tabs/overview/OverviewTab.js

// Import necessary Base components later (e.g., BaseCard, BaseFeed, BaseButton)
import BaseCard from '../../../common/BaseCard.js';
import BaseFeed from '../../../common/BaseFeed.js';
import BaseButton from '../../../common/BaseButton.js';
import BaseTextArea from '../../../common/BaseTextArea.js';
import BaseAvatar from '../../../common/BaseAvatar.js';
import BaseBadge from '../../../common/BaseBadge.js';

// Import Pinia store and helpers if needed directly (e.g., for user info)
// import { useUserStore } from '../../../store/userStore.js';
// const { mapState } = Pinia;

const OverviewTab = {
    name: 'OverviewTab',
    components: {
        // Register components like BaseCard, BaseFeed, etc. here when needed
        BaseCard,
        BaseFeed,
        BaseButton,
        BaseTextArea,
        BaseAvatar,
        BaseBadge
    },
    // Define the project prop
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        // Remove Vuex mapState for project data
        // ...(typeof Vuex !== 'undefined' ? Vuex.mapState('modal', { ... }) : { ... }),

        // Access notes via the prop
        notes() {
            const projNotes = this.project?.Notes;
            console.log('OverviewTab computed notes from prop:', projNotes);
            return projNotes || [];
        },
        // Access issues via the prop
        issues() {
            const projIssues = this.project?.Issues;
            console.log('OverviewTab computed issues from prop:', projIssues);
            return projIssues || [];
        },
        // Access events via the prop
        events() {
            const projEvents = this.project?.Events;
            console.log('OverviewTab computed events from prop:', projEvents);
            return projEvents || [];
        }
    },
    methods: {
        // --- ADD formatRelativeTime helper ---
        formatRelativeTime(timestamp) {
            if (!timestamp) return '';
            // Reuse logic from helpers.js (consider importing if DRY needed)
            const now = new Date();
            const past = new Date(timestamp);
            if (isNaN(past.getTime())) return 'Invalid Date';
            const diffInSeconds = Math.floor((now - past) / 1000);
            if (diffInSeconds < 60) return 'Just now';
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours}h ago`;
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays === 1) return 'Yesterday';
            return `${diffInDays}d ago`;
        },
        // --- ADD Status Badge Class Helper ---
        getStatusBadgeClass(status) {
            switch (status?.toLowerCase()) {
                case 'completed': return 'bg-green-100 text-green-800';
                case 'scheduled': return 'bg-blue-100 text-blue-800';
                case 'needs scheduling': return 'bg-yellow-100 text-yellow-800';
                case 'not required': return 'bg-gray-100 text-gray-600';
                case 'tbd': return 'bg-gray-100 text-gray-500';
                default: return 'bg-gray-100 text-gray-700';
            }
        },
        // --- ADD Event Date Formatting Helper ---
         formatEventDate(dateString) {
            if (!dateString) return 'Not Scheduled';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) throw new Error('Invalid date');
                // Format as: Jan 5, 2025 09:00 AM
                return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                });
            } catch (e) {
                console.error("Error formatting event date:", e, dateString);
                return 'Invalid Date';
            }
        },
        // -------------------------------------

        // Add methods for handling notes (add/reply), issues (resolve/add) later
        addNote() {
            alert('Add Note functionality not implemented yet.');
        },
        raiseIssue() {
            alert('Raise Issue functionality not implemented yet.');
        }
    },
    template: `
        <div class="overview-tab-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Left Column: Notes & Issues -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Notes Section -->
                <base-card>
                    <template #header>
                        <h3 class="text-lg font-medium text-gray-900">Notes</h3>
                    </template>
                    <template #default>
                        <div class="add-note-section mb-4">
                             <base-text-area 
                                placeholder="Add a new note..." 
                                rows="3"
                                class="mb-2"
                             />
                             <div class="flex justify-between items-center">
                                 <!-- TODO: Add tagging/notify options -->
                                 <div></div> 
                                 <base-button @click="addNote" size="sm" variant="primary">Add Note</base-button>
                             </div>
                        </div>
                        
                        <!-- Notes List -->
                        <ul v-if="notes.length > 0" role="list" class="divide-y divide-gray-200">
                            <li v-for="note in notes" :key="note.ID" class="py-4">
                                <div class="flex space-x-3">
                                    <base-avatar :name="note.Author || 'U'" size="sm" variant="gray"></base-avatar>
                                    <div class="flex-1 space-y-1">
                                        <div class="flex items-center justify-between">
                                            <h3 class="text-sm font-medium">{{ note.Author || 'Unknown User' }}</h3>
                                            <p class="text-sm text-gray-500">{{ formatRelativeTime(note.Added_Time) }}</p>
                                        </div>
                                        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ note.Note }}</p>
                                        <!-- TODO: Add Reply Button & Attachments -->
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <div v-else class="text-center text-gray-500 py-4">
                            No notes added yet.
                        </div>
                    </template>
                </base-card>

                 <!-- Issues Section -->
                 <base-card>
                    <template #header>
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-medium text-gray-900">Issues</h3>
                            <base-button @click="raiseIssue" variant="secondary" size="sm">+ Raise Issue</base-button>
                         </div>
                    </template>
                    <template #default>
                        <!-- Issues List -->
                        <ul v-if="issues.length > 0" role="list" class="divide-y divide-gray-200">
                             <li v-for="issue in issues" :key="issue.ID" class="py-4">
                                <div class="flex space-x-3">
                                    <base-avatar :name="issue.Author || 'U'" size="sm" variant="gray"></base-avatar>
                                    <div class="flex-1 space-y-1">
                                        <div class="flex items-center justify-between">
                                            <h3 class="text-sm font-medium">{{ issue.Author || 'Unknown User' }}</h3>
                                            <p class="text-sm text-gray-500">{{ formatRelativeTime(issue.Added_Time) }}</p>
                                        </div>
                                        <div class="flex justify-between items-start mt-1">
                                            <p class="text-sm text-gray-700 whitespace-pre-wrap flex-grow mr-4">{{ issue.Issue }}</p>
                                            <div class="flex-shrink-0 flex flex-col items-end space-y-1">
                                                 <base-badge v-if="issue.Is_Resolved" color="green">Resolved</base-badge> 
                                                 <base-badge v-else color="red">Open</base-badge>
                                                 <!-- TODO: Add Resolve button for open issues -->
                                                 <base-button v-if="!issue.Is_Resolved" size="xs" variant="secondary">Resolve</base-button>
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                         <div v-else class="text-center text-gray-500 py-4">
                            No issues reported.
                        </div>
                    </template>
                </base-card>
            </div>

            <!-- Right Column: Events -->
            <div class="lg:col-span-1">
                 <base-card>
                    <template #header>
                         <h3 class="text-lg font-medium text-gray-900">Events</h3>
                    </template>
                    <template #default>
                         <ul v-if="events.length > 0" role="list" class="divide-y divide-gray-200">
                             <li v-for="event in events" :key="event.id" class="py-3">
                                <div class="flex space-x-3">
                                    <!-- Icon Placeholder (can refine later) -->
                                     <div class="flex-shrink-0">
                                        <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-4 ring-white">
                                            <!-- TODO: Use dynamic icon based on event.type -->
                                             <i class="fas fa-calendar-alt h-4 w-4 text-white"></i>
                                        </span>
                                    </div>
                                    <div class="flex-1 space-y-1">
                                        <div class="flex items-center justify-between">
                                            <h3 class="text-sm font-medium">{{ event.type }}</h3>
                                            <!-- Status Display (Replace with Select later for editing) -->
                                            <span :class="['text-xs px-2 py-0.5 rounded-full', getStatusBadgeClass(event.status)]">{{ event.status }}</span>
                                        </div>
                                        <p v-if="event.date" class="text-sm text-gray-500">
                                            {{ formatEventDate(event.date) }}
                                        </p>
                                        <p v-else class="text-sm text-gray-400 italic">
                                            Not Scheduled
                                        </p>
                                         <!-- TODO: Add Edit/Book button later -->
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <div v-else class="p-4 text-center text-gray-500">
                            No events found.
                        </div>
                    </template>
                </base-card>
            </div>
        </div>
    `
};

export default OverviewTab; 