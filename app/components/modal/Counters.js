import BaseBadge from '../common/BaseBadge.js';
import { calculateDaysSince } from '../../utils/helpers.js';

export default {
    name: 'Counters',
    components: {
        BaseBadge
    },
    props: {
        project: {
            type: Object,
            required: true
        }
    },
    computed: {
        daysSinceSold() {
            return calculateDaysSince(this.project?.Date_Sold);
        },
        permitSubmissionDate() {
            // Accessing nested array - assumes Permitting exists and has at least one entry
            return this.project?.Permitting?.[0]?.Permit_Submission_Date;
        },
        daysSincePermitSubmission() {
            return calculateDaysSince(this.permitSubmissionDate);
        },
        // TODO: Add computed properties for PTO Submission and System Turned On later
        // daysSincePTOSubmission() { ... }
        // daysSinceSystemTurnedOn() { ... }
        
        // *** ADD PTO Approval Date ***
        ptoApprovalDate() {
            // Assuming this field exists directly on the project object
            // Adjust access path if it's nested (e.g., in Permitting)
            return this.project?.PTO_Approval_Date;
        },
        daysSincePTOApproval() {
            return calculateDaysSince(this.ptoApprovalDate);
        },
        // *** ADD System Turned On Date ***
        systemTurnedOnDate() {
             // Assuming this field exists directly on the project object
            return this.project?.System_Turned_On_Date;
        },
        daysSinceSystemTurnedOn() {
            return calculateDaysSince(this.systemTurnedOnDate);
        },
        
        // Determine which counters have valid values to display
        activeCounters() {
            const counters = [];
            if (this.daysSinceSold !== null) {
                counters.push({ 
                    key: 'sold', 
                    value: this.daysSinceSold, 
                    label: 'Sold', 
                    type: this.getCounterType(this.daysSinceSold)
                });
            }
            if (this.daysSincePermitSubmission !== null) {
                 counters.push({ 
                    key: 'permit', 
                    value: this.daysSincePermitSubmission, 
                    label: 'Permit Submitted', 
                    type: this.getCounterType(this.daysSincePermitSubmission)
                });
            }
            // *** ADD PTO Counter ***
             if (this.daysSincePTOApproval !== null) {
                 counters.push({ 
                    key: 'pto', 
                    value: this.daysSincePTOApproval, 
                    label: 'PTO Approved', // Changed label based on field name
                    type: this.getCounterType(this.daysSincePTOApproval)
                });
            }
             // *** ADD System On Counter ***
             if (this.daysSinceSystemTurnedOn !== null) {
                 counters.push({ 
                    key: 'systemOn', 
                    value: this.daysSinceSystemTurnedOn, 
                    label: 'System On', 
                    type: this.getCounterType(this.daysSinceSystemTurnedOn, true) // Pass true for special coloring
                });
            }
            return counters;
        },
    },
    methods: {
        // Determine badge color based on days passed
        getCounterType(days, isSystemTurnedOn = false) {
             // Using a slightly different color mapping for consistency with BaseBadge props
            if (days === null) return 'gray'; 

            if (isSystemTurnedOn) {
                 // Example: Green after 30 days for System On
                 return days >= 30 ? 'green' : 'blue'; 
            }
            // Standard thresholds
            if (days <= 30) return 'blue'; // Default/Blue
            if (days <= 60) return 'yellow'; // Warning/Yellow
            return 'red'; // Danger/Red
        }
    },
    template: `
        <div v-if="activeCounters.length > 0" class="modal-counters-section bg-gray-50 dark:bg-gray-800 p-3 border-y border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-start gap-3 flex-wrap">
                <template v-for="(counter, index) in activeCounters" :key="counter.key">
                    <!-- Counter Badge -->
                    <base-badge 
                        :color="counter.type" 
                        size="md" 
                        class="px-2.5 py-1"
                        :title="counter.value + ' days since ' + counter.label"
                    >
                        {{ counter.value }} Days Since {{ counter.label }}
                    </base-badge>
                    <!-- Divider (shown between badges) -->
                    <div v-if="index < activeCounters.length - 1" class="h-5 border-l border-gray-300 dark:border-gray-600"></div>
                </template>
            </div>
        </div>
    `
}; 