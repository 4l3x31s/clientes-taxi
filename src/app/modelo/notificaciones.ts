export class Notificaciones {
    constructor(
        public notification?: Notificacion,
        public data?: Data,
        public to?: string,
        public priority?: string,
        public restricted_package_name: string = ''
    ) {}
}
export class Notificacion {
    constructor(
        public title: string = 'Taxi',
        public body?: string ,
        public sound: string = 'default',
        public click_action: string = 'FCM_PLUGIN_ACTIVITY',
        public icon: string = 'fcm_push_icon'
    ) {}
}
export class Data {
    constructor (
        public landing_page?: string,
        public nombre?: string,
    ) {}
}