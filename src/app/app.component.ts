import { Component } from '@angular/core';

import { Platform, Events, NavController, AlertController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SesionService } from './services/sesion.service';
import { ClienteService } from './services/db/cliente.service';
import { MdlCliente } from './modelo/mdlCliente';
import { NavParamService } from './services/nav-param.service';
import { AlertService } from './services/util/alert.service';
import { LoadingService } from './services/util/loading.service';

import { FCM } from '@ionic-native/fcm/ngx';
import { Router } from '@angular/router';
import { TokenNotifService } from './services/token-notif.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  cliente: MdlCliente;

  public appPages = [
    {
      title: 'Solicitar Carrera',
      url: '/home',
      icon: 'logo-model-s'
    },
    {
      title: 'Carreras Aceptadas',
      url: '/carreras-aceptadas',
      icon: 'map'
    },
    {
      title: 'Calendario Carreras',
      url: '/calendario-carrera',
      icon: 'md-calendar'
    },
    {
      title: 'Crear Contrato',
      url: '/detalle-contrato',
      icon: 'clipboard'
    },
    {
      title: 'Contratos Solicitados',
      url: '/lista-contratos-solicitados',
      icon: 'filing'
    },
    {
      title: 'Contratos Aceptados',
      url: '/lista-contratos-vigentes',
      icon: 'done-all'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    public events: Events,
    public sesionService: SesionService,
    public navController: NavController,
    public navParam: NavParamService,
    public clienteService: ClienteService,
    public alertService: AlertService,
    public alertController: AlertController,
    public loadingService: LoadingService,
    private fcm: FCM,
    private router: Router,
    private tokenService: TokenNotifService
  ) {
    this.initializeApp();
    events.subscribe('user:login', () => {
      this.loggedIn();
    });
    events.subscribe('user:logout', () => {
      this.loggedOut();
    });
  }

  public loggedIn() {
    this.sesionService.getSesion()
      .subscribe(cliente=>{
        this.clienteService.getCliente(cliente.id)
          .subscribe( cliente => {
            this.cliente = cliente;
          });
      });
  }
  public loggedOut() {
    this.cliente = undefined;
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent();
      this.statusBar.backgroundColorByHexString('#c2185b');
      this.splashScreen.hide();

      this.fcm.subscribeToTopic('people');
      this.fcm.getToken().then(token => {
        this.tokenService.set(token);
      });
      this.fcm.onNotification().subscribe(data => {
        if (data.wasTapped) {
          this.router.navigate([data.landing_page, data.price]);
        } else {
          this.router.navigate([data.landing_page, data.price]);
        }
      });

      this.fcm.onTokenRefresh().subscribe(token => {
      });


      this.sesionService.getSesion()
        .subscribe(cliente => {
          if (cliente) {
            this.clienteService.getCliente(cliente.id)
            .subscribe( cliente => {
              this.cliente = cliente;
            });
          }
      });
    });
  }

  irPagina(pagina:any){
    this.navParam.set({cliente:this.cliente})
    this.navController.navigateRoot(pagina.url);
  }

  async irCerrarSesion(){
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Esta segur@ de cerrar su sesión?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Si',
          cssClass: 'primary',
          handler: () => {
            this.loadingService.present()
              .then(() => {
                this.sesionService.cerrarSesion()
                  .then(()=>{
                    this.events.publish('user:logout');
                    this.loadingService.dismiss();
                    this.navController.navigateRoot('/login');
                  })
                  .catch(e=>{
                    this.alertService.present('Error','Error al cerrar la sesion');
                    this.loadingService.dismiss();
                  })
              });
          }
        }
      ]
    });

    await alert.present();
  }

  irDetalleCliente(){
    this.navParam.set({cliente:this.cliente})
    this.navController.navigateRoot('/detalle-cliente');
  }
}


