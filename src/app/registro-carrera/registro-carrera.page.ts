import { Notificaciones } from './../modelo/notificaciones';
import { MdlConductora } from 'src/app/modelo/mldConductora';
import { ConductoraService } from 'src/app/services/db/conductora.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ClienteService } from '../services/db/cliente.service';
import { LoadingService } from '../services/util/loading.service';
import { AlertService } from '../services/util/alert.service';
import { NavController, ModalController, AlertController } from '@ionic/angular';
import { MdlCarrera } from '../modelo/mdlCarrera';
import { MdlCliente } from '../modelo/mdlCliente';
import { MapaPage } from '../comun/mapa/mapa.page';
import { SesionService } from '../services/sesion.service';
import { CarreraService } from '../services/db/carrera.service';
import * as moment from 'moment';
import { NavParamService } from '../services/nav-param.service';
import { MapParamService } from '../services/map-param.service';
import { Observable } from 'rxjs';
import { MdlParametrosCarrera } from '../modelo/mdlParametrosCarrera';
import { CarrerasAceptadasPage } from '../carreras-aceptadas/carreras-aceptadas.page';
import { ParametrosCarreraService } from '../services/db/parametros-carrera.service';
import * as _ from 'lodash';
import { PushNotifService } from '../services/push-notif.service';



@Component({
  selector: 'app-registro-carrera',
  templateUrl: './registro-carrera.page.html',
  styleUrls: ['./registro-carrera.page.scss'],
})

export class RegistroCarreraPage implements OnInit {
  frmCarrera: FormGroup;
  
  public lstParametrosCarrera: MdlParametrosCarrera [] = [];
  public lstFiltroParametrosCarrera: MdlParametrosCarrera [] = [];
  public parametroCarrera: MdlParametrosCarrera;
  public cliente: MdlCliente;
  public carrera: MdlCarrera;
  public fechaMin: string;
  pais: string;
  ciudad: string;
  distance: any;
  filtros = {};
  location: any;
  direccionIni: any = 'Donde te encontramos?';
  direccionFin: any = 'A donde quieres ir?';

  constructor(
    public fb: FormBuilder,
    public carreraService: CarreraService,
    public loadingServices: LoadingService,
    public alertService: AlertService,
    public navController: NavController,
    public modalController: ModalController,
    public sesionService: SesionService,
    public navParams: NavParamService,
    public alertController: AlertController,
    public mapParamService: MapParamService,
    public parametrosCarreraService: ParametrosCarreraService,
    public conductoraService: ConductoraService,
    public pushNotifService: PushNotifService,
    ) {
      this.carrera = this.carreraService.getCarreraSesion();
      this.carrera.fechaInicio = moment().format();
      this.fechaMin = moment().format('YYYY-MM-DD');
     
      /*this.carrera.latInicio = this.navParams.get().latitudIni;
      this.carrera.longInicio = this.navParams.get().longitudIni;
      this.carrera.latFin = this.navParams.get().latitudFin;
      this.carrera.longFin = this.navParams.get().longitudFin;*/
      this.pais = this.navParams.get().pais;
      this.ciudad = this.navParams.get().ciudad;
      this.location = this.navParams.get().location;
      if(this.location) {
        this.carrera.latInicio = this.location.lat;
        this.carrera.longInicio = this.location.lng;
        this.carrera.latFin = this.location.lat;
        this.carrera.longFin = this.location.lng;
      }
   
      this.carrera.moneda = 'Bolivianos';
      this.distance = new google.maps.DistanceMatrixService();
      //this.carrera.costo = 35;
     }

  get f(): any { return this.frmCarrera.controls; }

  ngOnInit() {
    this.iniciarValidaciones();
    this.sesionService.crearSesionBase()
    .then(() => {
      this.sesionService.getSesion()
        .subscribe((cliente) => {
          if (cliente) {
            this.cliente = cliente;
           
            this.determinarDistanciaTiempo();
          } else {
            this.navController.navigateRoot('/login');
          }
        });
    });

  }



  public iniciarValidaciones(){
    this.frmCarrera = this.fb.group({
      vdescLugar: ['', [
        Validators.required,
      ]],
      vmoneda: ['', [
        Validators.required,
      ]],
      vfechaInicio: ['', [
        Validators.required,
      ]],
      vtipoPago: ['', [
        Validators.required,
      ]],
    })
  }
 

  async validarHoraPeticionCarrera() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'No puede registrar una hora menor a la actual.',
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  async confirmarFecha() {
    let fechaCarrera =  moment(this.carrera.fechaInicio).toObject();
    let fechaCarreraMoment = moment(fechaCarrera);
    let fechaActual = moment().format();
    let mensaje = null;

    if(fechaCarreraMoment.diff(fechaActual, 'seconds') < -120 ) {
      this.validarHoraPeticionCarrera();
    }else{     
      const alert = await this.alertController.create({
        header: 'Confirmar',
        message: 'Desea crear la carrera en:  <br>' +
                 'Fecha:  <strong>' + fechaCarrera.date  + '/' + (fechaCarrera.months + 1) + '/' + fechaCarrera.years + '</strong> <br> ' +
                 'Hora :  <strong>' + fechaCarrera.hours + ':' + fechaCarrera.minutes + ' ? </strong>',
        buttons: [
          {
            text: 'cancelar',
            role: 'cancelar',
            cssClass: 'secondary',
            handler: (blah) => {
              //this.grabar();
            }
          }, {
            text: 'Confirmar',
            handler: () => {
              this.grabar();
            }
          }
        ]
      });

      await alert.present();
    }
  }
  public grabar(){
    this.loadingServices.present();
    //Notificaciones PUSH
    

    //var identificadorPrueba = Date.now();
    this.carrera.idUsuario = this.cliente.id;
    this.carrera.estado = 1;
    this.carrera.nombreCliente = this.cliente.nombre;
    this.carrera.pais = this.pais;
    this.carrera.ciudad = this.ciudad;



      this.carreraService.crearCarrera(this.carrera)
      .then(() => {
        this.conductoraService.getConductoraPorPaisCiudad(this.pais.toUpperCase(), this.ciudad.toUpperCase())
          .subscribe( lstConductoras => {
            for(let item of lstConductoras) {
              if(item.ui) {
                let notificaciones = {
                  notification:{
                    title: 'Carrera!!!!',
                    body: 'Hay una carrera disponible, deberias tomarla!!!!',
                    sound: 'default',
                    click_action: 'FCM_PLUGIN_ACTIVITY',
                    icon: 'fcm_push_icon'
                  },
                  data: {
                    landing_page: 'home',
                  },
                  to: item.ui,
                  priority: 'high',
                  restricted_package_name: ''
                };
                this.pushNotifService.postGlobal(notificaciones, '')
                .subscribe(response => {
                  
                });
              }
            }
          });
        this.loadingServices.dismiss();
        this.alertService.present('Información', 'Datos guardados correctamente.');
        this.carrera = this.carreraService.getCarreraSesion();
      })
      .catch( error => {
        this.loadingServices.dismiss();
        
        this.alertService.present('Error','Hubo un error al grabar los datos');
      })

      this.navController.navigateRoot('/calendario-carrera');

  }

  async irMapaOrigen() {
    
    let ubicacion: any = { lat: this.carrera.latInicio, lng: this.carrera.longInicio};
    this.mapParamService.set(ubicacion);
    const modal = await this.modalController.create({
      component: MapaPage
    }).then( dato => {
      dato.present();
      dato.onDidDismiss().then(resultado => {
        
        this.carrera.latInicio = resultado.data.lat;
        this.carrera.longInicio = resultado.data.lng;
        var geocoder = new google.maps.Geocoder();
        let mylocation = new google.maps.LatLng(this.carrera.latInicio, this.carrera.longInicio);
        geocoder.geocode({'location': mylocation}, (results, status: any) => {
          if (status === 'OK') {
            
            this.processLocation(results, true);
          }
        });
        //calcular costo
        this.determinarDistanciaTiempo();
      });
    });
  }
  processLocation(location, tipo: boolean) {
    if (location[1]) {
      for (var i = 0; i < location.length; i++) {
        
        for (let j = 0; j < location[i].types.length; j++) {
          if (location[i].types[j] === 'route') {
          
            if (tipo) {
              this.direccionIni = location[i].formatted_address;
            } else {
              this.direccionFin = location[i].formatted_address;
            }
          }
        }
      }
    }
  }

  async irMapaDestino() {
    let ubicacion: any = { lat: this.carrera.latFin, lng: this.carrera.longFin};
    this.mapParamService.set(ubicacion);
    const modal = await this.modalController.create({
        component: MapaPage
    }).then(dato => {
        dato.present();
        dato.onDidDismiss().then(resultado => {
         
          this.carrera.latFin = resultado.data.lat;
          this.carrera.longFin = resultado.data.lng;
          var geocoder = new google.maps.Geocoder();
          let mylocation = new google.maps.LatLng(this.carrera.latFin, this.carrera.longFin);
          geocoder.geocode({'location': mylocation}, (results, status: any) => {
            if (status === 'OK') { 
          
              this.processLocation(results, false);
            }
          });
          //calcular costo
          this.determinarDistanciaTiempo();
        });
    });
  }

  public async determinarDistanciaTiempo() {
    let responseMatrix: google.maps.DistanceMatrixRequest;

    responseMatrix = {
        origins:
            [{
                lat: Number(this.carrera.latInicio),
                lng: Number(this.carrera.longInicio)
            }],
        destinations:
            [{
                lat: Number(this.carrera.latFin),
                lng: Number(this.carrera.longFin)
            }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        durationInTraffic: false,
        avoidHighways: false,
        avoidTolls: false
    };
    
    this.parametrosPorPais(this.pais);

    let datos = this.getDistanceMatrix(responseMatrix);
    datos.subscribe(data => {
        
        const origins = data.originAddresses;        
        for (let i = 0; i < origins.length; i++) {
            const results = data.rows[i].elements;
            for (let j = 0; j < results.length; j++) {
                const element = results[j];
                const distance = element.distance.value;
                const time = element.duration.value;
             
                // calcular costos UBER: https://calculouber.netlify.com/
                let montoFinal: number = Math.round((this.parametroCarrera.base + ((element.duration.value / 60) * this.parametroCarrera.tiempo) + ((element.distance.value / 1000) * this.parametroCarrera.distancia))* this.parametroCarrera.tarifaDinamica + this.parametroCarrera.cuotaSolicitud);
            
                if (montoFinal < 10) {
                    this.carrera.costo = 10;
                } else {
                    this.carrera.costo = montoFinal;
                }
            }
        }
    });
    
  }

  
   
  public parametrosPorPais(pais: string) {
    this.loadingServices.present();    
    this.parametrosCarreraService.getParametrosPorPais(pais).subscribe( data => {
      this.loadingServices.dismiss();
      this.lstParametrosCarrera = Object.assign(data);
      this.filtrar('ciudad',this.ciudad.toUpperCase());
    },  error => {
      this.loadingServices.dismiss();
    });
  }

  public filtrar(atributo: string, valor: any) {
    this.filtros[atributo] = val => val == valor;
    this.lstFiltroParametrosCarrera = _.filter(this.lstParametrosCarrera, _.conforms(this.filtros) );
    this.parametroCarrera = this.lstFiltroParametrosCarrera[0];    
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
}

