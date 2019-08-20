export class MdlCliente {
    constructor(
        public id: number,
        public nombre: string,
        public ci: string,
        public direccion: string,
        public user: string,
        public pass: string,
        public tel: number,
        public cel: number,
        public email: string,
        public ui: string,
        public estado: boolean,
        public pais?: string,
        public ciudad?: string
    ) {

    }
}