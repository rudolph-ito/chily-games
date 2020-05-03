import { Component, OnInit } from "@angular/core";
import { AuthenticationService } from "./services/authentication.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.styl"]
})
export class AppComponent implements OnInit {
  title = "frontend";

  constructor(private readonly authenticationService: AuthenticationService) {}

  ngOnInit(): void {
    this.authenticationService.initUser();
  }
}
