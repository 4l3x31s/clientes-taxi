/// <reference types='@types/googlemaps' />
import { Observable } from 'rxjs';
import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { MdlCarrera } from 'src/app/modelo/mdlCarrera';
import { ModalController, NavController, ActionSheetController } from '@ionic/angular';
import { ClienteService } from 'src/app/services/db/cliente.service';
import { AlertService } from 'src/app/services/util/alert.service';
import { MdlCliente } from 'src/app/modelo/mdlCliente';
import { LoadingService } from 'src/app/services/util/loading.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { CarreraService } from 'src/app/services/db/carrera.service';
import { ConductoraService } from 'src/app/services/db/conductora.service';
import { MdlConductora } from 'src/app/modelo/mldConductora';
import { CalificarCarreraPage } from '../calificar-carrera/calificar-carrera.page';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-detalle-carrera',
  templateUrl: './detalle-carrera.page.html',
  styleUrls: ['./detalle-carrera.page.scss'],
})
export class DetalleCarreraPage implements OnInit {

  @Input()
  carrera: MdlCarrera;
  mostrarBoton;
  mostrarCalificacion;

  form: FormGroup;
  

  cliente: MdlCliente;
  conductora: MdlConductora;

  codigoColorCliente: string;
  colores: any[] = [
    {
      codigo: 'red', descripcion: 'Rojo'
    },
    {
      codigo: 'blue', descripcion: 'Azul'
    },
    {
      codigo: 'green', descripcion: 'Verde'
    },
    {
      codigo: 'black', descripcion: 'Negro'
    },
    {
      codigo: 'darkcyan', descripcion: 'Verde Petroleo'
    },
    {
      codigo: 'darkgreen', descripcion: 'Verde Oscuro'
    },
  ];

  @ViewChild('map')
  mapElement: ElementRef;

  constructor(
    private modalCtrl:ModalController,
    public clienteService:ClienteService,
    public alertService: AlertService,
    public navController: NavController,
    public loadingService: LoadingService,
    public iab: InAppBrowser,
    public actionSheetController: ActionSheetController,
    public carreraService: CarreraService,
    public conductoraService: ConductoraService

  ) { }

  ngOnInit() {
    this.mostrarBoton=false;
    if(!this.carrera.enCamino){
      this.mostrarBoton=true;
    }
    this.mostrarCalificacion=false;
    if(!this.carrera.enCamino){
      this.mostrarCalificacion=true;
    }

    this.carreraService.getCarrerasPorId(this.carrera.id).subscribe(carrera=>{
      this.carrera = Object.assign(carrera[0]);

    }, error=>{

    });
    this.conductoraService.getConductora(this.carrera.idConductora).subscribe(conductora=>{
        this.conductora = conductora;

    });
    this.cargarDatos();
  }

  initAutocomplete() {
    let latInicio = typeof(this.carrera.latInicio)==='string'?parseFloat(this.carrera.latInicio):this.carrera.latInicio;
    let lngInicio = typeof(this.carrera.longInicio)==='string'?parseFloat(this.carrera.longInicio):this.carrera.longInicio;
    let latFin = typeof(this.carrera.latFin)==='string'?parseFloat(this.carrera.latFin):this.carrera.latFin;
    let lngFin = typeof(this.carrera.longFin)==='string'?parseFloat(this.carrera.longFin):this.carrera.longFin;
    
    const myLatlngIni = { lat: latInicio, lng: lngInicio};
    const myLatlngFin = { lat: latFin, lng: lngFin};

    const mapOptions = {
      zoom: 11,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: true,
      fullScreenControl: false,
      scaleControl: false,
      rotateControl: false,
      center: myLatlngFin
    };
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#EE4088'
      }
    });
    var map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    directionsDisplay.setMap(map);
    let respuesta = this.calculateAndDisplayRoute(directionsService, directionsDisplay, myLatlngIni, myLatlngFin);
    respuesta.subscribe(data => {

    });
    let markers = [];
    markers.push(new google.maps.Marker
      ({
        position: myLatlngFin,
        map: map,
        icon: 'assets/image/pin-flag.png' //label: 'B'
      }));
    markers.push(new google.maps.Marker
      ({
        position: myLatlngIni,
        map: map,
        icon: 'assets/image/pin-check.png' //label: 'A'
      }));
    
  }

  public cargarDatos(){
    this.loadingService.present().then(()=>{
      this.clienteService.getCliente(this.carrera.idUsuario).subscribe(cliente=>{
        
        this.cliente = cliente;
        this.codigoColorCliente = this.colores.find(x => x.codigo == this.clienteService.getColorPorCliente(this.cliente.id)).codigo;
        this.initAutocomplete();
        this.loadingService.dismiss();
        }, error=>{
        console.error(error);
        this.loadingService.dismiss();
        this.alertService.present('Error', 'Error al el cliente en la carrera.');
        this.navController.navigateRoot('/login');
      })
    }); 
  }

  cerrar(){
    this.modalCtrl.dismiss();
  }

  irWhatsApp(){
    this.iab.create('https://api.whatsapp.com/send?phone=591'+this.conductora.celular+'&text=', '_system', 'location=yes');
  }

  async showOpcionesCarrera(){
    let opciones:any[]=[];
    if(this.carrera.estado == 1){
      opciones.push({
        text: 'Editar Carrera',
        icon: 'create',
        handler: () => {

          this.navController.navigateForward('/registro-carrera');
          this.modalCtrl.dismiss();
        }
      });
    }
    if(this.carrera.enCamino==false){
      opciones.push({
        text: 'Califica la carrera',
        icon: 'star',
        handler: () =>{

          this.calificarCarrera();
        }
      });
      opciones.push({
        text: 'Regresar',
        icon: 'close',
        role: 'cancel'
      });
      const actionSheet = await this.actionSheetController.create({
        header: 'Opciones Carrera',
        buttons: opciones
      });
      await actionSheet.present();
    }
  }
  calculateAndDisplayRoute(directionsService, directionsDisplay, myLatlngIni, myLatlngFin): Observable<any> {
    return Observable.create((observer) => {
      directionsService.route({
        origin: myLatlngIni,
        destination: myLatlngFin,
        travelMode: google.maps.TravelMode.DRIVING
      }, function(response, status) {
        if (status === 'OK') {
          directionsDisplay.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
        observer.next(response);
        observer.complete();
      });
    });
  }
  async calificarCarrera(){
    const modal = await this.modalCtrl.create({
      component: CalificarCarreraPage,
      componentProps: {
        carrera: this.carrera
      }
    });
    modal.onDidDismiss().then(() => {
      this.cargarDatos();
    });
    return await modal.present();
  }
  cambiarColor(){
    this.clienteService.setColorCliente(this.cliente.id, this.codigoColorCliente);
  }
}
