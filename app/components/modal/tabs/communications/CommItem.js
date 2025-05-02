const { ref, computed } = Vue; // Use global Vue
const { useDateFormat, useTimeFormat } = VueUse; // Use global VueUse for date and time formatting
import { getInitials } from '../../../../utils/helpers.js';
import BaseAvatar from '../../../common/BaseAvatar.js';
import BaseBadge from '../../../common/BaseBadge.js';

// Assume BaseAvatar, BaseBadge, BaseButton are globally registered or import them

export default {
    name: 'CommItem',
    components: {
        BaseAvatar,
        BaseBadge
    },
    props: {
        communication: { 
            type: Object, 
            required: true 
        }
    },
    setup(props) {
        const { ref, computed } = Vue; // Use global Vue destructured
        
        const isExpanded = ref(false); // For call details

        const itemType = computed(() => {
            return props.communication.Communication_Type?.toLowerCase() || 'unknown';
        });

        const isOutgoingSms = computed(() => {
            return itemType.value === 'sms' && props.communication.SMS_Type === 'OUTGOING';
        });

        const sender = computed(() => {
            if (itemType.value === 'sms') {
                return isOutgoingSms.value 
                    ? (props.communication.User?.zc_display_value || 'System') 
                    : (props.communication.Contact?.zc_display_value || 'Unknown Contact');
            } else if (itemType.value === 'call') {
                return props.communication.User?.zc_display_value || props.communication.Agent_Email || 'Unknown Agent';
            } else if (itemType.value === 'email') {
                return props.communication.User?.zc_display_value || 'System';
            }
            return 'System';
        });

        const recipient = computed(() => {
             if (itemType.value === 'sms') {
                 return isOutgoingSms.value 
                     ? (props.communication.Contact?.zc_display_value || 'Unknown Contact') 
                     : (props.communication.User?.zc_display_value || 'System');
             } else if (itemType.value === 'email') {
                 // --- Handle comma-separated emails in Email_To ---
                 const emailToStr = props.communication.Email_To || 'N/A';
                 if (emailToStr.includes(',')) {
                     // Split, trim, and rejoin
                     return emailToStr.split(',')
                                    .map(email => email.trim())
                                    .filter(email => email) // Remove empty strings after trim
                                    .join(', ');
                 } else {
                     return emailToStr; // Return single email as is
                 }
                 // --- End modification ---
             } else if (itemType.value === 'call') {
                 // Depending on inbound/outbound, might be user or contact
                 return props.communication.Contact?.zc_display_value || 'N/A';
             }
             return 'N/A';
        });
        
        const displayTime = computed(() => {
            const timeStr = props.communication.SMS_Sent_Time || props.communication.Email_Sent_Time || props.communication.Call_Start_Time || props.communication.Added_Time;
            // Use VueUse's useDateFormat instead of formatDateTime
            return useDateFormat(timeStr, 'MM/DD/YY h:mm A').value;
        });

        // Format duration using VueUse's useTimeFormat
        const formatDuration = (duration) => {
            if (!duration) return '';
            // Format as minutes:seconds
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        const callStatusInfo = computed(() => {
            if (itemType.value !== 'call') return {};
            const callType = props.communication.Call_Type1 || props.communication.Call_Type;
            switch(callType?.toLowerCase()) {
                case 'inbound': return { color: 'green', icon: 'fa-phone-alt', text: 'Incoming' };
                case 'outbound': return { color: 'blue', icon: 'fa-phone', text: 'Outgoing' };
                case 'missed': return { color: 'red', icon: 'fa-phone-slash', text: 'Missed' };
                default: return { color: 'gray', icon: 'fa-phone', text: callType || 'Unknown' };
            }
        });
        
        // Placeholder - refine based on available data and requirements
        const callDescriptionDetails = computed(() => {
            if (itemType.value !== 'call' || !props.communication.Description) return [];
            // Basic split, assuming key: value pairs per line
            try {
                return props.communication.Description.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.includes(':'))
                    .map(line => {
                        const parts = line.split(':');
                        const key = parts[0].trim();
                        const value = parts.slice(1).join(':').trim();
                        return { key, value };
                    });
            } catch(e) {
                console.error("Error parsing call description:", e);
                return [{ key: 'Details', value: props.communication.Description }]; // Fallback
            }
        });

        // --- ADD Email Status Badge Logic ---
        const emailStatusBadge = computed(() => {
            const status = props.communication.Email_Status?.toLowerCase();
            if (!status) return { text: null, color: 'gray' };

            switch (status) {
                case 'opened':
                    return { text: props.communication.Email_Status, color: 'green' };
                case 'sent':
                    return { text: props.communication.Email_Status, color: 'blue' };
                case 'soft bounce':
                     return { text: props.communication.Email_Status, color: 'yellow' };
                case 'hard bounce':
                     return { text: props.communication.Email_Status, color: 'red' };
                // Handle other known statuses if necessary (e.g., clicked, deferred?)
                // case 'clicked': 
                //     return { text: props.communication.Email_Status, color: 'teal' }; 
                default:
                    // Display unknown statuses with gray color
                    console.warn(`CommItem: Unknown Email_Status encountered: ${props.communication.Email_Status}`);
                    return { text: props.communication.Email_Status, color: 'gray' }; 
            }
        });

        const toggleExpansion = () => {
            if (itemType.value === 'call') {
                isExpanded.value = !isExpanded.value;
            }
        };

        return {
            isExpanded,
            itemType,
            isOutgoingSms,
            sender,
            recipient,
            displayTime,
            callStatusInfo,
            callDescriptionDetails,
            emailStatusBadge,
            toggleExpansion,
            formatDuration,
            getInitials,
            BaseAvatar,
            BaseBadge
        };
    },
    // Template incorporating different views based on itemType
    template: `
        <div class="comm-item">
            <!-- SMS View -->
            <div v-if="itemType === 'sms'" :class="['flex mb-3', isOutgoingSms ? 'justify-end' : 'justify-start']">
                <div :class="['max-w-[75%] px-3 py-2 shadow-sm', isOutgoingSms ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg']">
                    <p class="text-sm mb-1 whitespace-pre-wrap">{{ communication.SMS_Content }}</p>
                    <div :class="['text-xs mt-1 flex items-center gap-1.5 flex-wrap', isOutgoingSms ? 'text-blue-100' : 'text-gray-500']">
                        <span>{{ displayTime }}</span>
                        <span>•</span>
                        <span>{{ isOutgoingSms ? 'Sent by ' + sender : 'From ' + sender }}</span>
                        <span v-if="isOutgoingSms && communication.SMS_Delivery_Status" :class="{'text-green-300': communication.SMS_Delivery_Status === 'DELIVERED', 'text-red-300': communication.SMS_Delivery_Status !== 'DELIVERED'}">
                            • {{ communication.SMS_Delivery_Status === 'DELIVERED' ? 'Delivered' : 'Not Delivered' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Call View -->
             <div v-else-if="itemType === 'call'" class="mb-3">
                <div :class="['bg-white rounded-lg shadow-sm p-3 border-l-4 hover:shadow-md transition-shadow duration-200', 'border-' + callStatusInfo.color + '-500']">
                    <div class="flex justify-between items-center mb-2">
                        <div :class="['flex items-center gap-2', 'text-' + callStatusInfo.color + '-600']">
                             <i :class="['fas', callStatusInfo.icon, 'fa-fw']"></i>
                             <span class="font-medium text-sm text-gray-700">{{ callStatusInfo.text }} Call</span>
                         </div>
                         <div class="flex items-center gap-1.5 text-xs text-gray-500">
                            <i class="far fa-clock text-gray-400"></i>
                            <span>{{ displayTime }}</span>
                         </div>
                    </div>
                    
                     <div class="flex items-center justify-between gap-3 text-xs text-gray-600 pt-2 border-t border-gray-100">
                         <div class="flex items-center flex-wrap gap-x-3 gap-y-1">
                            <span v-if="communication.Call_Duration" class="inline-flex items-center gap-1">
                                 <i class="far fa-clock text-gray-400"></i> {{ formatDuration(communication.Call_Duration) }}
                            </span>
                            <span v-if="sender" class="inline-flex items-center gap-1">
                                <BaseAvatar :initials="getInitials(sender)" size="xs" class="mr-1"/>
                                {{ sender }}
                            </span>
                             <span v-if="recipient !== 'N/A'" class="inline-flex items-center gap-1">
                                 <i class="far fa-address-book text-gray-400"></i> {{ recipient }}
                             </span>
                         </div>
                         <button 
                             v-if="communication.Description" 
                             @click="toggleExpansion" 
                             class="text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors">
                             <span>{{ isExpanded ? 'Hide Details' : 'View Details' }}</span>
                             <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down', 'text-xs']"></i>
                         </button>
                    </div>

                    <div v-if="isExpanded && callDescriptionDetails.length > 0" class="mt-3 text-xs bg-gray-50 p-3 rounded border border-gray-100 space-y-1.5">
                        <div v-for="(detail, index) in callDescriptionDetails" :key="index">
                            <span class="text-gray-500 block font-medium">{{ detail.key }}:</span>
                            <span class="text-gray-700 whitespace-pre-wrap">{{ detail.value }}</span>
                        </div>
                    </div>
                     <div v-else-if="isExpanded && communication.Description" class="mt-3 text-xs bg-gray-50 p-3 rounded border border-gray-100">
                         <p class="text-gray-700 whitespace-pre-wrap">{{ communication.Description }}</p>
                     </div>
                </div>
            </div>

            <!-- Email View -->
            <div v-else-if="itemType === 'email'" class="mb-3">
                 <div class="bg-white rounded-lg shadow-sm p-3 border-l-4 border-blue-500 hover:shadow-md transition-shadow duration-200">
                     <div class="flex items-start space-x-3">
                         <div class="pt-1">
                            <i class="fas fa-envelope fa-fw text-blue-500"></i>
                         </div>
                         <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center mb-1">
                                <p class="text-sm font-medium text-gray-800 truncate pr-2">{{ communication.Email_Subject || 'Email' }}</p>
                                <p class="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{{ displayTime }}</p>
                            </div>
                             <!-- Updated layout for alignment -->
                            <div class="text-xs text-gray-500 flex items-center justify-between">
                                <!-- Group text elements -->
                                <div class="flex items-center space-x-2">
                                    <span>To: {{ recipient }}</span>
                                    <span>•</span>
                                    <span>Sent by: {{ sender }}</span>
                                    <span v-if="communication.Email_Type">• Type: {{ communication.Email_Type }}</span>
                                </div>
                                <!-- Status Badge -->
                                <BaseBadge 
                                    v-if="emailStatusBadge.text" 
                                    :color="emailStatusBadge.color" 
                                    size="sm"
                                    class="shrink-0" 
                                >
                                    {{ emailStatusBadge.text }}
                                </BaseBadge>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
            
            <!-- Fallback for Unknown Type -->
            <div v-else class="mb-3">
                <div class="bg-gray-100 rounded-lg p-3 border border-gray-200">
                    <p class="text-sm font-medium text-gray-700">Unknown Communication Type</p>
                    <p class="text-xs text-gray-500">ID: {{ communication.ID }}</p>
                    <pre class="text-xs mt-1 overflow-x-auto bg-gray-200 p-1 rounded">{{ communication }}</pre>
                </div>
            </div>
        </div>
    `
}; 