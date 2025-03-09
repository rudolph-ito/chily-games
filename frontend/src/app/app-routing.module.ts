import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./components/home/home.component";
import { VariantsIndexComponent } from "./components/cyvasse/variants-index/variants-index.component";
import { VariantFormComponent } from "./components/cyvasse/variant-form/variant-form.component";
import { AuthGuard } from "./guards/auth.guard";
import { VariantShowComponent } from "./components/cyvasse/variant-show/variant-show.component";
import { PieceRuleFormComponent } from "./components/cyvasse/piece-rule-form/piece-rule-form.component";
import { TerrainRuleFormComponent } from "./components/cyvasse/terrain-rule-form/terrain-rule-form.component";
import { ChallengesIndexComponent } from "./components/cyvasse/challenges-index/challenges-index.component";
import { CyvasseGamesIndexComponent } from "./components/cyvasse/cyvasse-games-index/cyvasse-games-index.component";
import { CyvasseGameShowComponent } from "./components/cyvasse/cyvasse-game-show/cyvasse-game-show.component";
import { YanivGamesIndexComponent } from "./components/yaniv/yaniv-games-index/yaniv-games-index.component";
import { YanivGameShowComponent } from "./components/yaniv/yaniv-game-show/yaniv-game-show.component";
import { OhHeckGamesIndexComponent } from "./components/oh-heck/oh-heck-games-index/oh-heck-games-index.component";
import { OhHeckGameShowComponent } from "./components/oh-heck/oh-heck-game-show/oh-heck-game-show.component";
import { RummikubGameShowComponent } from "./components/rummikub/rummikub-game-show/rummikub-game-show.component";
import { RummikubGamesIndexComponent } from "./components/rummikub/rummikub-games-index/rummikub-games-index.component";

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent,
  },
  {
    path: "cyvasse/variants",
    component: VariantsIndexComponent,
  },
  {
    path: "cyvasse/variants/new",
    component: VariantFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "cyvasse/variants/:variantId",
    component: VariantShowComponent,
  },
  {
    path: "cyvasse/variants/:variantId/edit",
    component: VariantFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "cyvasse/variants/:variantId/pieceRules/new",
    component: PieceRuleFormComponent,
  },
  {
    path: "cyvasse/variants/:variantId/pieceRules/:pieceRuleId/edit",
    component: PieceRuleFormComponent,
  },
  {
    path: "cyvasse/variants/:variantId/terrainRules/new",
    component: TerrainRuleFormComponent,
  },
  {
    path: "cyvasse/variants/:variantId/terrainRules/:terrainRuleId/edit",
    component: TerrainRuleFormComponent,
  },
  {
    path: "cyvasse/challenges",
    component: ChallengesIndexComponent,
  },
  {
    path: "cyvasse/games",
    component: CyvasseGamesIndexComponent,
  },
  {
    path: "cyvasse/games/:gameId",
    component: CyvasseGameShowComponent,
  },
  {
    path: "oh-heck/games",
    component: OhHeckGamesIndexComponent,
  },
  {
    path: "oh-heck/games/:gameId",
    component: OhHeckGameShowComponent,
  },
  {
    path: "rummikub/games",
    component: RummikubGamesIndexComponent,
  },
  {
    path: "rummikub/games/:gameId",
    component: RummikubGameShowComponent,
  },
  {
    path: "yaniv/games",
    component: YanivGamesIndexComponent,
  },
  {
    path: "yaniv/games/:gameId",
    component: YanivGameShowComponent,
  },
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
