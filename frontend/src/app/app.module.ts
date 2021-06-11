import { NgModule } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTableModule } from "@angular/material/table";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SocketIoModule } from "./modules/socket.io/socket-io.module";
import { TimeagoModule } from "ngx-timeago";

import { AppComponent } from "./app.component";
import { HomeComponent } from "./components/home/home.component";
import { NavigationBarComponent } from "./components/navigation-bar/navigation-bar.component";
import { UserRegisterFormDialogComponent } from "./components/navigation-bar/user-register-form-dialog/user-register-form-dialog.component";
import { UserLoginFormDialogComponent } from "./components/navigation-bar/user-login-form-dialog/user-login-form-dialog.component";
import { VariantsIndexComponent } from "./components/cyvasse/variants-index/variants-index.component";
import { VariantFormComponent } from "./components/cyvasse/variant-form/variant-form.component";
import { VariantShowComponent } from "./components/cyvasse/variant-show/variant-show.component";
import { PieceRuleFormComponent } from "./components/cyvasse/piece-rule-form/piece-rule-form.component";
import { TerrainRuleFormComponent } from "./components/cyvasse/terrain-rule-form/terrain-rule-form.component";
import { ChallengesIndexComponent } from "./components/cyvasse/challenges-index/challenges-index.component";
import { CyvasseGameShowComponent } from "./components/cyvasse/cyvasse-game-show/cyvasse-game-show.component";
import { CyvasseGamesIndexComponent } from "./components/cyvasse/cyvasse-games-index/cyvasse-games-index.component";
import { YanivGamesIndexComponent } from "./components/yaniv/yaniv-games-index/yaniv-games-index.component";
import { YanivGameShowComponent } from "./components/yaniv/yaniv-game-show/yaniv-game-show.component";
import { YanivGameScoreboardDialogComponent } from "./components/yaniv/yaniv-game-scoreboard-dialog/yaniv-game-scoreboard-dialog.component";
import { ConfirmationDialogComponent } from "./components/common/confirmation-dialog/confirmation-dialog.component";
import { OhHeckGamesIndexComponent } from "./components/oh-heck/oh-heck-games-index/oh-heck-games-index.component";
import { OhHeckGameShowComponent } from "./components/oh-heck/oh-heck-game-show/oh-heck-game-show.component";
import { OhHeckNewGameDialogComponent } from "./components/oh-heck/oh-heck-new-game-dialog/oh-heck-new-game-dialog.component";
import { OhHeckGameScoreboardDialogComponent } from "./components/oh-heck/oh-heck-game-scoreboard-dialog/oh-heck-game-scoreboard-dialog.component";
import { ChatComponent } from "./components/common/chat/chat.component";

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
    CyvasseGameShowComponent,
    CyvasseGamesIndexComponent,
    YanivGamesIndexComponent,
    YanivGameShowComponent,
    YanivGameScoreboardDialogComponent,
    ConfirmationDialogComponent,
    OhHeckGamesIndexComponent,
    OhHeckGameShowComponent,
    OhHeckNewGameDialogComponent,
    OhHeckGameScoreboardDialogComponent,
    ChatComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatBadgeModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SocketIoModule.forRoot({
      url: "",
      options: {},
    }),
    TimeagoModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
