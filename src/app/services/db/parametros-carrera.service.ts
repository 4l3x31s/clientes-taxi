import { UtilService } from './../util/util.service';
import { AngularFireDatabase } from '@angular/fire/database';
import { Injectable } from '@angular/core';
import { MdlParametrosCarrera } from 'src/app/modelo/mdlParametrosCarrera';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParametrosCarreraService {
  rootRef: firebase.database.Reference;
  constructor(
    public afDB: AngularFireDatabase,
    public utilService: UtilService
  ) {
    this.rootRef = this.afDB.database.ref();
   }
   insertarParametro(parametro: MdlParametrosCarrera) {
     if (!parametro.id) {
       parametro.id = Date.now();
     }
     return this.afDB.database.ref('parametro-carrera/' + parametro.id).set(this.utilService.serializar(parametro));
   }
  
   listarParametros() {
     return this.afDB.list('parametro-carrera').valueChanges();
   }   

   getParametrosPorPais(pais: string) {    
 
    return this.afDB.list('parametro-carrera', ref =>
      ref.orderByChild('pais').equalTo(pais.toUpperCase())).valueChanges();
  }

}
