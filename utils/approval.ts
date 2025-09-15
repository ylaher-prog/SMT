import type { Teacher, Position } from '../types';

/**
 * Traverses the management hierarchy to build an approval chain for a given requester.
 * @param requesterId The ID of the teacher initiating the request.
 * @param teachers The full list of all teachers.
 * @returns An array of teacher IDs representing the approval chain, from direct manager upwards.
 */
export const getApprovalChain = (
    requesterId: string,
    teachers: Teacher[]
): string[] => {
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const chain: string[] = [];
    
    let currentUser = teacherMap.get(requesterId);
    
    while (currentUser?.managerId) {
        const manager = teacherMap.get(currentUser.managerId);
        if (manager) {
            chain.push(manager.id);
            currentUser = manager;
        } else {
            // Break if a manager in the chain is not found to prevent infinite loops
            break; 
        }
    }
    
    return chain;
};
