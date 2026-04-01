import * as ActionCable from '@rails/actioncable';
import { CABLE_URL } from '../config';



export function buildCamionetaCableUrl(token: string) {
    return `${CABLE_URL}?token=${encodeURIComponent(token)}`;
}

export function createCamionetaCableConsumer(token: string) {
    return ActionCable.createConsumer(buildCamionetaCableUrl(token));
}