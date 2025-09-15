import type { Notification } from '../types';

export const generateNotification = (
  userId: string,
  type: Notification['type'],
  data: any,
  tenantId: string
): Notification => {
  let message = '';
  switch (type) {
    case 'leaveStatus':
      message = `Your leave request for ${data.startDate} to ${data.endDate} has been ${data.status}.`;
      break;
    case 'newParentQuery':
      message = `New parent query from ${data.parentName} has been assigned to you.`;
      break;
    case 'parentQueryUpdate':
      message = `The status of the query from ${data.parentName} has been updated to ${data.status}.`;
      break;
    case 'slaBreach':
      message = `SLA Breach Alert: ${data.teacherName} has the following breaches: ${data.breaches.join(', ')}.`;
      break;
    case 'parentQueryStatusUpdateToParent':
      message = `Update on your query regarding ${data.studentName}: The status is now '${data.status}'.`;
      break;
    case 'taskDueSoon':
        message = `Task due soon: "${data.taskTitle}" in board "${data.boardTitle}".`;
        break;
    default:
      message = 'You have a new notification.';
  }

  return {
    id: `notif-${Date.now()}`,
    userId,
    type,
    data,
    timestamp: new Date().toISOString(),
    read: false,
    message,
    tenantId,
  };
};
