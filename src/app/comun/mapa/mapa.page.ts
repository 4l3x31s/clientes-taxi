import { AlertService } from './../../services/util/alert.service';
import { ToastService } from './../../services/util/toast.service';
import { NavController, ModalController } from '@ionic/angular';
import { NavParamService } from './../../services/nav-param.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { MapParamService } from 'src/app/services/map-param.service';
import { Geolocation } from '@ionic-native/geolocation/ngx';

declare var google;

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements OnInit {
  @ViewChild('map') mapElement: ElementRef;
  map: any;
  latitud: string;
  longitud: string;
  paginaRetorno: string;
  searchBox: any;

  constructor(
    public navParam: NavParamService,
    public navCtrl: NavController,
    public toastCtrl: ToastService,
    public modalController: ModalController,
    public alertController: AlertService,
    public mapParamService: MapParamService,
    public geolocation: Geolocation,
    ) { }

  ngOnInit() {
    if (this.navParam.get()){
      this.paginaRetorno = this.navParam.get().page;
    } else {
    
    }
    
    this.initAutocomplete();
  }
  initAutocomplete() {

    let myLatlng: any = { lat: -16.4971653, lng: -68.1320507};
    let ubicacion = this.mapParamService.get();

    if (ubicacion) {
      if (ubicacion.lat !== null) {
        myLatlng = { lat: parseFloat(ubicacion.lat), lng: parseFloat(ubicacion.lng)};
        this.cargarMapa(myLatlng);
      } else {
        this.obtenerGeolocalizacion();
      }
    } else {
      this.obtenerGeolocalizacion();
    }
  }
  obtenerGeolocalizacion() {
      navigator.geolocation.getCurrentPosition((resp) => {
        let myLatlng = { lat: resp.coords.latitude, lng: resp.coords.longitude};
        this.cargarMapa(myLatlng);
      });
  }
  cargarMapa(myLatlng: any) {
    const mapOptions = {
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullScreenControl: false,
      zoomControl: false,
      scaleControl: false,
      rotateControl: false,
      fullscreenControl: false,
      center: myLatlng
    };
    this.latitud = myLatlng.lat;
    this.longitud = myLatlng.lng;
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    this.iniciarBusqueda();
    let markers = [];
    markers.push(new google.maps.Marker
      ({
        position: myLatlng,
        map: this.map,
        draggable: true,
        title: 'Mueveme',
        animation: google.maps.Animation.DROP,
        icon: 'assets/image/car-pin.png'
      }));
    markers[0].addListener('dragend', () => {

      const objStr: string = JSON.stringify(markers[0].getPosition());
      const obj = JSON.parse(objStr);
      // window.alert(JSON.stringify(marker.getPosition()));
      this.latitud = obj.lat;
      this.longitud = obj.lng;
    });
    let respuesta = this.buscarTexto(this.map, markers, this.alertController);
    respuesta.subscribe( markers2 => {

            let direccion = JSON.parse(JSON.stringify(markers2[0].position));
            this.latitud = direccion.lat;
            this.longitud = direccion.lng;
      let respuesta = this.markerEvent(markers2);
          respuesta.subscribe(obj => {
            this.latitud = obj.lat;
            this.longitud = obj.lng;

          })
    })
  }
  iniciarBusqueda() {
    let input = document.getElementById('pac-input');
    this.searchBox = new google.maps.places.SearchBox(input);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    this.map.addListener('bounds_changed', () =>{
      this.searchBox.setBounds(this.map.getBounds());
    });
  }

  buscarTexto(map,markers, alertController): Observable<any> {
    return Observable.create((observer) => {
      this.searchBox.addListener('places_changed', () =>{
        let places = this.searchBox.getPlaces();
        if (places.length === 0) {
          return;
        }
        markers.forEach(function(marker) {
          marker.setMap(null);
        });
        markers = [];
        var bounds = new google.maps.LatLngBounds();
        let contador = 0;
        places.forEach(function(place) {
          if (!place.geometry) {
  
            return;
          }
          if (contador < 1) {
            markers.push(new google.maps.Marker({
              map: map,
              draggable: true,
              title: 'Mueveme',
              animation: google.maps.Animation.DROP,
              position: place.geometry.location,
              icon: 'assets/image/car-pin.png'
            }));
            /*
            let direccion = JSON.parse(JSON.stringify(place.geometry.location));
            this.latitud = direccion.lat;
            this.longitud = direccion.lng;
       
            */
            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          }
          contador++;
        });
      
        if(contador === 1) {
          map.fitBounds(bounds);
          observer.next(markers);
          observer.complete();
        } else {
          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          alertController.present('Alerta', 'debes escojer una opcion de la lista');
          return;
        }
      });
  });
  }
  markerEvent(markers): Observable<any> {
    return Observable.create((observer) => {
      
        markers[0].addListener('dragend', () => {
        
        const objStr: string = JSON.stringify(markers[0].getPosition());
        const obj = JSON.parse(objStr);
        observer.next(obj);
        observer.complete();
      });
      
  });
  }
  guardarLatLong() {
    if(this.latitud && this.longitud){
      this.toastCtrl.presentToast('Los datos fueron guardados exitosamente');
      this.modalController.dismiss({
        lat: this.latitud,
        lng: this.longitud
    });
    } else {
      this.alertController.present('Alerta', 'Debes seleccionar un punto antes de terminar.');
    }
  }

  cerrar(){
    this.modalController.dismiss();
  }
}
