import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AccountService } from '../_services/account.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  // @Input() users: any;
  @Output() cancelRegister = new EventEmitter();

  model:any = {};

  constructor(private accountService: AccountService, private toastr: ToastrService){

  }
  ngOnInit(): void {
  }

  register(){
    this.accountService.register(this.model).subscribe({
      next: response => {
        console.log(response);
        this.cancel();
      },
      error: e => {
        this.toastr.error(e.error);
      }
    })
  }


  cancel(){
    this.cancelRegister.emit(false);
  }


}
