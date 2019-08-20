import { Component, OnInit, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { MdlCarrera } from 'src/app/modelo/mdlCarrera';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { CarreraService } from 'src/app/services/db/carrera.service';
import { AlertService } from 'src/app/services/util/alert.service';

@Component({
  selector: 'calificar-carrera',
  templateUrl: './calificar-carrera.page.html',
  styleUrls: ['./calificar-carrera.page.scss'],
})


export class CalificarCarreraPage implements OnInit {

  @Input()
  carrera: MdlCarrera;
  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    public fb: FormBuilder,
    public alertController: AlertController,
    public carreraService: CarreraService,
    public alertService: AlertService
  ) { }

  ngOnInit() {
    this.carrera.califConductora = 3;
    this.iniciarValidaciones();
  }
  iniciarValidaciones() {
    this.form = this.fb.group({
      vcalifConductora: ['', [
        Validators.required,
      ]],
      vobservacion: ['', [
        Validators.required,
      ]]
    });
  }

  get f(): any { return this.form.controls; }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async confirmarTerminar() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Desea poner esa calificacion a su conductor?',
      buttons: [
        {
          text: 'cancelar',
          role: 'cancelar',
          cssClass: 'secondary',
          handler: () => {
            //this.grabar();
          }
        }, {
          text: 'Confirmar',
          handler: () => {
            this.guardarCalif();
          }
        }
      ]
    });

    await alert.present();
  }
  guardarCalif(){
    this.carreraService.saveCalif(this.carrera)
      .then(()=>{
        this.alertService.present('Información','Calificacion guardada');
        this.cerrar();
      });
  }
}
