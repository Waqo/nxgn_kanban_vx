const CommunicationsTab = {
    name: 'CommunicationsTab',
    props: {
        project: { 
            type: Object, 
            required: true 
        }
    },
    computed: {
        communications() {
            // Processor should ensure Communication is an array and sort it
            const comms = this.project?.Communication || [];
            // Sort newest first based on available date/time fields
            return comms.sort((a, b) => {
                const timeA = new Date(a.SMS_Sent_Time || a.Email_Sent_Time || a.Call_Start_Time || a.Added_Time || 0).getTime();
                const timeB = new Date(b.SMS_Sent_Time || b.Email_Sent_Time || b.Call_Start_Time || b.Added_Time || 0).getTime();
                return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
            });
        }
    },
    methods: {
        formatDateTime(timestamp) {
            if (!timestamp) return 'N/A';
            try {
                return new Date(timestamp).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric', 
                    hour: 'numeric', minute: '2-digit', hour12: true 
                });
            } catch (e) {
                return 'Invalid Date';
            }
        },
        getCommIcon(comm) {
            switch(comm.Communication_Type?.toLowerCase()) {
                case 'call': return 'fas fa-phone-alt text-blue-500';
                case 'sms': return 'fas fa-comment-alt text-green-500';
                case 'email': return 'fas fa-envelope text-purple-500';
                default: return 'fas fa-broadcast-tower text-gray-400';
            }
        },
        // Placeholder for potentially adding manual communication later
        addCommunication() {
            alert('Add Communication functionality not implemented yet.');
        }
    },
    template: `
        <div class="communications-tab-content">
             <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Communications Log</h3>
                 <!-- <button @click="addCommunication" class="text-sm text-blue-600 hover:text-blue-800">+ Log Communication</button> -->
            </div>

            <div v-if="communications.length > 0">
                 <ul role="list" class="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white shadow-sm">
                    <li v-for="comm in communications" :key="comm.ID" class="px-4 py-3">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0 pt-1">
                                <i :class="[getCommIcon(comm), 'fa-lg w-5 text-center']"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <p class="text-sm font-medium text-gray-800 truncate">
                                        {{ comm.Subject_field || comm.Email_Subject || comm.Communication_Type || 'Communication' }}
                                         <span class="text-xs font-normal text-gray-500 ml-2">by {{ comm.User?.zc_display_value || comm.Agent_Email || 'System' }}</span>
                                    </p>
                                    <p class="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 ml-4">
                                        {{ formatDateTime(comm.SMS_Sent_Time || comm.Email_Sent_Time || comm.Call_Start_Time || comm.Added_Time) }}
                                    </p>
                                </div>
                                <p v-if="comm.Description || comm.SMS_Content" class="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100">
                                    {{ comm.Description || comm.SMS_Content }}
                                </p>
                                <!-- Add more details like Call Duration, To/From etc. if needed -->
                                <div class="text-xs text-gray-500 mt-1 space-x-3">
                                     <span v-if="comm.Call_Duration">Duration: {{ comm.Call_Duration }}s</span>
                                     <span v-if="comm.Contact?.zc_display_value">Contact: {{ comm.Contact.zc_display_value }}</span>
                                     <span v-if="comm.Email_To">To: {{ comm.Email_To }}</span>
                                     <span v-if="comm.SMS_Delivery_Status">Status: {{ comm.SMS_Delivery_Status }}</span>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
            <div v-else class="text-center text-gray-500 py-6 border border-dashed border-gray-300 rounded-md">
                No communications logged for this project.
            </div>
        </div>
    `
};

export default CommunicationsTab; 