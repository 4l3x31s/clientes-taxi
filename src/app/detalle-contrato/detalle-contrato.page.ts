/// <reference types="@types/googlemaps" />

import {AlertService} from 'src/app/services/util/alert.service';
import {ParametrosCarreraService} from './../services/db/parametros-carrera.service';
import {MdlFeriado} from './../modelo/mdlFeriado';
import {MdlCliente} from './../modelo/mdlCliente';
import {MdlConductora} from './../modelo/mldConductora';
import {CarreraService} from './../services/db/carrera.service';
import {MdlContrato} from './../modelo/mdlContrato';
import {MapaPage} from './../comun/mapa/mapa.page';
import {NavParamService} from './../services/nav-param.service';
import {NavController, ModalController, AlertController} from '@ionic/angular';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Component, OnInit} from '@angular/core';
import {FeriadosService} from 'src/app/services/db/feriados.service';
import {LoadingService} from 'src/app/services/util/loading.service';
import {MdlParametrosCarrera} from 'src/app/modelo/mdlParametrosCarrera';
import {Observable} from 'rxjs';
import { SesionService } from '../services/sesion.service';
import { ContratoService } from '../services/db/contrato.service';
import { MapParamService } from '../services/map-param.service';

declare var google: any;

@Component({
    selector: 'app-detalle-contrato',
    templateUrl: './detalle-contrato.page.html',
    styleUrls: ['./detalle-contrato.page.scss'],
})
export class DetalleContratoPage implements OnInit {
    frmContrato: FormGroup;
    public contrato: MdlContrato = new MdlContrato(
        null, null, null, null, null, 
        null, null, null, null, null, 
        null, null, null, null, null, 
        null, null, null, null
    );
    public lstClientes: MdlCliente[] = [];
    public lstFeriados: MdlFeriado[] = [];
    public lstParametros: MdlParametrosCarrera [] = [];
    public lstCiudadesFiltrado: MdlParametrosCarrera [] = [];
    public lstPaisesFiltrados = [];
    public cliente: MdlCliente;
    public ciudadSeleccionada: string;
    

    // directionsService = new google.maps.DirectionsService;
    // directionsDisplay = new google.maps.DirectionsRenderer;
    distance: any;

    constructor(public fb: FormBuilder,
                public navController: NavController,
                public navParamService: NavParamService,
                public modalController: ModalController,
                public feriadoService: FeriadosService,
                public carreraService: CarreraService,
                public loading: LoadingService,
                public parametrosService: ParametrosCarreraService,                
                public alertService: AlertService,
                public alertController: AlertController,
                public sesionService: SesionService,
                public contratoService: ContratoService,
                public loadingServices: LoadingService,
                public mapParamService: MapParamService) {
       // this.cliente = this.navParams.get().cliente;
        this.distance = new google.maps.DistanceMatrixService();
    }

    ngOnInit() {
        this.initValidaciones();
        this.obtenerParametros();
        this.obtenerFeriados();
        this.sesionService.crearSesionBase()
        .then(() => {
        this.sesionService.getSesion()
            .subscribe((cliente) => {
            if (cliente) {
                this.cliente = cliente;
                
                this.contrato = this.navParamService.get();                
            } else {
                this.navController.navigateRoot('/login');
            }
            });
        });
    }

    filtrarCiudades(event) {
        
        this.lstCiudadesFiltrado = this.lstParametros.filter(
            parametros => parametros.pais.indexOf(event) > -1
        );
    }

    seleccionarCiudad(event) {
        this.ciudadSeleccionada = event;
        /*this.lstCiudadesFiltrado = this.lstParametros.filter(
            parametros => parametros.pais.indexOf(event) > -1
        );*/
    }

    grabar() {
        this.loadingServices.present();
        this.contrato.idUsuario = this.cliente.id;
        // TODO: Validaciones de guardado acá.
        this.contratoService.insertarContrato(this.contrato)
        .then(() => {
            this.loadingServices.dismiss();
            this.alertService.present('Información','Datos guardados correctamente.');
            this.navController.navigateRoot('/lista-contratos-solicitados');
        })
        .catch( error => {
            this.loadingServices.dismiss();
         
            this.alertService.present('Error','Hubo un error al grabar los datos');                
        })
    }

    async obtenerParametros() {
        this.loading.present();
        await this.parametrosService.listarParametros().subscribe(data => {
            // this.loading.dismiss();
            this.lstParametros = Object.assign(data);
            this.lstPaisesFiltrados = Array.from(new Set(this.lstParametros.map(s => s.pais)))
                .map(id => {
                    return {
                        id: id,
                        pais: this.lstParametros.find(s => s.pais === id).pais,
                    };
                });
            
        }, error => {
            // this.loading.dismiss();
        });
    }

    obtenerFeriados() {
        // this.loading.present();
        this.feriadoService.listaFeriados().subscribe(data => {
            this.loading.dismiss();
            this.lstFeriados = Object.assign(data);
        }, error => {
            this.loading.dismiss();
        });
    }

    initValidaciones() {
        this.frmContrato = this.fb.group({
            vPais: ['', [
                Validators.required,
            ]],
            vCiudad: ['', [
                Validators.required,
            ]],
            vFechaInicio: ['', [
                Validators.required,
            ]],
            vFechaFin: ['', [
                Validators.required,
            ]],
            /*vLatOrigen: ['', [
                Validators.required,
            ]],
            vLatDestino: ['', [
                Validators.required,
            ]],
            vMontoTotal: ['', [
                Validators.required,
            ]],*/
            vCantidadPasajeros: ['', [
                Validators.required,
            ]],
            vDias: ['', [
                Validators.required,
            ]],
            vHora: ['', [
                Validators.required,
            ]],
            vTipoPago: ['', [
                Validators.required,
            ]],
            vTituloContrato: ['', [
                Validators.required,
                Validators.minLength(4),
                Validators.maxLength(50),
            ]],
        });
    }

    get f() {
        return this.frmContrato.controls;
    }

    async irMapaOrigen() {
        let ubicacion: any;
        if(this.contrato.latOrigen){
            ubicacion = { lat: this.contrato.latOrigen, lng: this.contrato.longOrigen};
        }else{
            ubicacion = { lat: -16.4978888, lng: -68.1314424};
        }
        this.mapParamService.set(ubicacion);
        const modal = await this.modalController.create({
            component: MapaPage
        }).then(dato => {
            dato.present();
            dato.onDidDismiss().then(resultado => {
              
                this.contrato.latOrigen = resultado.data.lat;
                this.contrato.longOrigen = resultado.data.lng;
                if(this.contrato.latDestino != null){
                    this.determinarDistanciaTiempo();
                }
            });
        });
    }

    async irMapaDestino() {
        let ubicacion: any;
        if(this.contrato.latDestino){
            ubicacion = { lat: this.contrato.latDestino, lng: this.contrato.longDestino};
        }else{
            ubicacion = { lat: -16.4978888, lng: -68.1314424};
        }
        this.mapParamService.set(ubicacion);
        const modal = await this.modalController.create({
            component: MapaPage
        }).then(dato => {
            dato.present();
            dato.onDidDismiss().then(resultado => {
                
                this.contrato.latDestino = resultado.data.lat;
                this.contrato.longDestino = resultado.data.lng;
                //calcular costo
                //this.contrato.montoTotal = 150;
                if(this.contrato.latOrigen != null){
                    this.determinarDistanciaTiempo();
                }
            });
        });
    }

    async presentAlertCheckbox() {
        const alert = await this.alertController.create({
            header: 'Días',
            inputs: [
                {
                    name: 'lunes',
                    type: 'checkbox',
                    label: 'Lunes',
                    value: 'LU',
                    checked: true
                },

                {
                    name: 'martes',
                    type: 'checkbox',
                    label: 'Martes',
                    value: 'MA'
                },

                {
                    name: 'miercoles',
                    type: 'checkbox',
                    label: 'Miércoles',
                    value: 'MI'
                },

                {
                    name: 'jueves',
                    type: 'checkbox',
                    label: 'Jueves',
                    value: 'JU'
                },

                {
                    name: 'viernes',
                    type: 'checkbox',
                    label: 'Viernes',
                    value: 'VI'
                },

                {
                    name: 'sabado',
                    type: 'checkbox',
                    label: 'Sábado',
                    value: 'SA'
                },
                {
                    name: 'domingo',
                    type: 'checkbox',
                    label: 'Domingo',
                    value: 'DO'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        
                    }
                }, {
                    text: 'Ok',
                    handler: (data) => {
                        
                        this.contrato.dias = null;
                        for (let i = 0; i < data.length; i++) {
                            if (this.contrato.dias) {
                                this.contrato.dias = this.contrato.dias + ',' + data[i];
                            } else {
                                this.contrato.dias = data[i];
                            }
                        }
                    }
                }
            ]
        });

        await alert.present();
    }

    getDistanceMatrix(req: google.maps.DistanceMatrixRequest): Observable<google.maps.DistanceMatrixResponse> {
        return Observable.create((observer) => {
            this.distance.getDistanceMatrix(req, (rsp, status) => {
                // status checking goes here
             
                observer.next(rsp);
                observer.complete();
            });
        });
    }

    public async determinarDistanciaTiempo() {
     

        if (this.lstCiudadesFiltrado) {
            let responseMatrix: google.maps.DistanceMatrixRequest;

            responseMatrix = {
                origins:
                    [{
                        lat: Number(this.contrato.latOrigen),
                        lng: Number(this.contrato.longOrigen)
                    }],
                destinations:
                    [{
                        lat: Number(this.contrato.latDestino),
                        lng: Number(this.contrato.longDestino)
                    }],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                durationInTraffic: false,
                avoidHighways: false,
                avoidTolls: false
            };

            /*const valor = await this.distance.getDistanceMatrix(
              responseMatrix , this.callBack
            );*/
            let datos = this.getDistanceMatrix(responseMatrix);
            datos.subscribe(data => {
                
                let ciudadParametro: MdlParametrosCarrera[] = this.lstCiudadesFiltrado.filter(
                    parametros => parametros.ciudad.indexOf(this.ciudadSeleccionada) > -1
                );
                const origins = data.originAddresses;
                const destinations = data.destinationAddresses;
                for (let i = 0; i < origins.length; i++) {
                    const results = data.rows[i].elements;
                    for (let j = 0; j < results.length; j++) {
                        const element = results[j];
                        const distance = element.distance.value;
                        const time = element.duration.value;
                        
                        // calcular costos UBER: https://calculouber.netlify.com/
                        
                        let montoFinal: number = (ciudadParametro[0].base + ((element.duration.value / 60) * ciudadParametro[0].tiempo) + ((element.distance.value / 1000) * ciudadParametro[0].distancia));
                      
                        if (montoFinal < 10) {
                            this.contrato.montoTotal = 10;
                        } else {
                            this.contrato.montoTotal = montoFinal;
                        }
                    }
                }
            });
        } else {
            // TODO: decir que no hay que calcular sin conductoras
        }
    }

    async callBack(response: any, status: any) {
      
        /*let ciudadParametro: MdlParametrosCarrera[] = this.lstCiudadesFiltrado.filter(
          parametros => parametros.ciudad.indexOf(this.ciudadSeleccionada) > -1
        );*/
        if (status === 'OK') {
            const origins = response.originAddresses;
            const destinations = response.destinationAddresses;
            for (let i = 0; i < origins.length; i++) {
                const results = response.rows[i].elements;
                for (let j = 0; j < results.length; j++) {
                    const element = results[j];
                    const distance = element.distance.value;
                    const time = element.duration.value;
          
                    // let montoFinal: number = (ciudadParametro[0].base + (element.duration.value * ciudadParametro[0].tiempo) + (element.distance.value * ciudadParametro[0].distancia));
                    // this.contrato.montoTotal = montoFinal;
                    return await {distance: distance, time: time};
                }
            }
        }
    }

    /*

    http://uber-tarifas-la-paz-bo.ubertarifa.com/

    https://calculouber.netlify.com/
    
    Buscador en los mapas
    Bolsa de Credito - mensual
    Pago efectivo - A la conductora
    Ambas caras de los documentos -> detalle de documentos

    Validacion de horas - 30 minimo de validacion
    Que se registre igual pero con alerta.




    Modulos Extras
    Pagos online -pay me


    */
   
}
