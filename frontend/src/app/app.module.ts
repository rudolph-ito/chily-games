import { NgModule } from "@angular/core";

import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTableModule } from "@angular/material/table";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ReactiveFormsModule } from "@angular/forms";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./components/home/home.component";
import { NavigationBarComponent } from "./components/navigation-bar/navigation-bar.component";
import { UserRegisterFormDialogComponent } from "./components/navigation-bar/user-register-form-dialog/user-register-form-dialog.component";
import { UserLoginFormDialogComponent } from "./components/navigation-bar/user-login-form-dialog/user-login-form-dialog.component";
import { VariantsIndexComponent } from "./components/variants-index/variants-index.component";
import { VariantFormComponent } from "./components/variant-form/variant-form.component";
import { VariantShowComponent } from "./components/variant-show/variant-show.component";
import { PieceRuleFormComponent } from "./components/piece-rule-form/piece-rule-form.component";
import { TerrainRuleFormComponent } from "./components/terrain-rule-form/terrain-rule-form.component";
import { ChallengesIndexComponent } from "./components/challenges-index/challenges-index.component";
import { GameShowComponent } from "./components/game-show/game-show.component";
import { GamesIndexComponent } from "./components/games-index/games-index.component";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavigationBarComponent,
    UserRegisterFormDialogComponent,
    UserLoginFormDialogComponent,
    VariantsIndexComponent,
    VariantFormComponent,
    VariantShowComponent,
    PieceRuleFormComponent,
    TerrainRuleFormComponent,
    ChallengesIndexComponent,
    GameShowComponent,
    GamesIndexComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
