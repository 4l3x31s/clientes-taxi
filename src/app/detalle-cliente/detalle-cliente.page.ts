import { TokenNotifService } from './../services/token-notif.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MdlCliente } from '../modelo/mdlCliente';
import { ClienteService } from '../services/db/cliente.service';
import { LoadingService } from '../services/util/loading.service';
import { AlertService } from '../services/util/alert.service';
import { NavController, Events } from '@ionic/angular';
import { SesionService } from '../services/sesion.service';
import { MdlParametrosCarrera } from '../modelo/mdlParametrosCarrera';
import { ParametrosCarreraService } from '../services/db/parametros-carrera.service';
import { AuthService } from '../services/firebase/auth.service';

@Component({
  selector: 'app-detalle-cliente',
  templateUrl: './detalle-cliente.page.html',
  styleUrls: ['./detalle-cliente.page.scss'],
})
export class DetalleClientePage implements OnInit {

  frmCliente: FormGroup;
  public titulo: string;
  public myclass: string;
  public cliente: MdlCliente;
  public lstPaisesFiltrados = [];
  public lstCiudadesFiltrado: MdlParametrosCarrera [] = [];
  public lstParametros: MdlParametrosCarrera [] = [];

  constructor(
    public fb: FormBuilder,
    public clienteService: ClienteService,
    public loadingServices: LoadingService,
    public alertService: AlertService,
    public navController: NavController,
    public sesionService: SesionService,
    public loadingService: LoadingService,
    public parametrosService: ParametrosCarreraService,
    public events: Events,
    public authService: AuthService,
    public tokenService: TokenNotifService
    ) { 
    this.sesionService.crearSesionBase()
        .then(() => {
        this.sesionService.getSesion()
            .subscribe((cliente) => {
            if (cliente) {
                this.cliente = cliente;
                this.titulo = 'Editar Perfil';
            } else {
              this.cliente = this.clienteService.getClienteSesion();
              this.titulo = 'Crear nueva cuenta';
            }
            });
        });
  }

  get f() { return this.frmCliente.controls; }

  ngOnInit() {
   
    this.iniciarValidaciones();
    this.obtenerParametros();
    if(this.cliente.id !== null){
      this.myclass = "ocultar";
      this.frmCliente.get('vconfirmPass').setValue(this.cliente.pass);
    }else{
      this.myclass = "mostrar";      
    }
    
  }

  public iniciarValidaciones(){
    this.frmCliente = this.fb.group({
      vnombre: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(50),
      ]],
      /*vci: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(15),
        Validators.pattern(/^[0-9]/),
      ]],
      vdireccion: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(100),
      ]],*/
      vuser: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
      ]],
      vpass: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30),
      ]],
      vconfirmPass: ['',
       Validators.required],
      /*vtel: ['', [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(7),
        Validators.pattern(/^[0-9]/),
      ]],*/
      vcel: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(15),
        Validators.pattern(/^[0-9]/),
      ]],
      vemail: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(30),
        Validators.email,
      ]],
      vciudad: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(30),
      ]],
      vpais: ['', [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(30),
      ]],
    }, {
      validator: this.mustMatch('vpass', 'vconfirmPass')
    });
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const matchingControl = formGroup.controls[matchingControlName];

        if (matchingControl.errors && !matchingControl.errors.mustMatch) {
            // return if another validator has already found an error on the matchingControl
            return;
        }

        // set error on matchingControl if validation fails
        if (control.value !== matchingControl.value) {
            matchingControl.setErrors({ mustMatch: 'Las contraseñas no coinciden' });
        } else {
            matchingControl.setErrors(null);
        }
    }
}

  public grabar(){
      this.loadingService.present().then(() => {
        this.cliente.user = this.cliente.email;
        this.cliente.ui = this.tokenService.get();
        this.cliente.estado = true;
        if(this.cliente.ui === undefined) {
          this.cliente.ui = null;
        }
        if (this.cliente && this.cliente.id != null) {
          this.clienteService.crearCliente(this.cliente)
          .then((conductora) => {
            this.cliente = conductora;
            this.loadingService.dismiss();
            this.alertService.present('Info', 'Datos guardados correctamente.');  // edita cliente
            this.navController.navigateRoot('/home');
            //this.ingresar();
          })
          .catch(error => {
            this.loadingService.dismiss();

            this.alertService.present('Error', 'Hubo un error al grabar los datos');
            this.navController.navigateRoot('/home');
          });
        } else {
          this.authService.doRegister(this.cliente.user, this.cliente.pass)
          .then(res => {
            this.clienteService.crearCliente(this.cliente)
            .then((cliente) => {
              this.cliente = cliente;
              this.loadingService.dismiss();
              this.alertService.present('Info', 'Datos guardados correctamente.');   // nuevo cliente
              //this.navController.navigateRoot('/home');
              this.ingresar();
            })
            .catch(error => {
              this.loadingService.dismiss();
      
              this.alertService.present('Error', 'Hubo un error al grabar los datos');
              this.navController.navigateRoot('/home');
            });
          }, error => {
            this.loadingService.dismiss();
      
            this.alertService.present('Error', 'Hubo un error al grabar los datos');
            this.navController.navigateRoot('/home');
          })
        }
      });  
  }

  public ingresar() {
    this.loadingService.present()
      .then(() => {
        this.sesionService.login(this.cliente.user)
          .subscribe(() => {
            
            this.events.publish('user:login');
            this.navController.navigateRoot('/home');
            this.loadingService.dismiss();
            
          }, error => {
           
            if (error.message) {
              this.alertService.present('Error', error.message);
            } else {
              this.alertService.present('Error', 'Hubo un error al ingresar.');
            }
            this.loadingService.dismiss();
          });
      })
  }


  obtenerParametros() {
    this.loadingService.present()
      .then(() => {
        this.parametrosService.listarParametros().subscribe(data => {
          this.loadingService.dismiss();
          this.lstParametros = Object.assign(data);
          this.lstPaisesFiltrados = Array.from(new Set(this.lstParametros.map(s => s.pais)))
          .map(id => {
            return {
              id: id,
              pais: this.lstParametros.find( s => s.pais === id).pais,
            };
          });
          this.filtrarCiudades(this.lstParametros[0].pais);
        }, error => {
          
        });
      });
    
  }

  filtrarCiudades(event) {
    this.lstCiudadesFiltrado = this.lstParametros.filter(
      parametros => parametros.pais.indexOf(event) > -1
    );
  }

  public generarUsuario(){
    this.cliente.user = this.cliente.email;
  }

  public cerrar(){
    if(this.cliente.id !== null){
      this.navController.navigateRoot('/home');
    }else{
      this.navController.navigateRoot('/login');  
    }
  }
}
