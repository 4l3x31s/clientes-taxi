import { MdlCliente } from './../../modelo/mdlCliente';
import { AngularFireDatabase } from '@angular/fire/database';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UtilService } from '../util/util.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  rootRef: firebase.database.Reference;
  public utilService: UtilService;
  
  constructor(public afDB: AngularFireDatabase) {
    this.rootRef = this.afDB.database.ref();
   }
   crearCliente(mdlCliente: MdlCliente): Promise<any> {
    if(!mdlCliente.id){
      mdlCliente.id = Date.now();
    }
    
    return this.afDB.database.ref('cliente/' + mdlCliente.id).set(mdlCliente)
        .then(()=>{
          return Promise.resolve(mdlCliente);
        })
        .catch(e=>{
          return Promise.reject(e);
        });
  }

  getClienteSesion(): MdlCliente {
    return new MdlCliente(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null, 
      null);
  }

  getCliente(id: number): Observable<MdlCliente>{
    return this.afDB.object<MdlCliente>('cliente/'+id).valueChanges();
  }

  getClientePorUser(user: string) : Observable<MdlCliente[]> {
    return new Observable<MdlCliente[]>(observer => {
      this.afDB.list<MdlCliente>('cliente/',
        ref => ref.orderByChild('user').equalTo(user)).valueChanges()
        .subscribe(cliente=>{
      
          if(cliente.length > 0 ){
            observer.next(cliente);
          } else {
            observer.next();
          }
          observer.complete();
        });
    });
  }
  getColorPorCliente(idCliente: number): string {
    let color = localStorage.getItem('colorCliente-'+idCliente);
    if(!color){
      color = "black";
    }
    return color;
  }
  setColorCliente(idCliente: number, color:string){
    localStorage.setItem('colorCliente-'+idCliente, color);
  }
}
