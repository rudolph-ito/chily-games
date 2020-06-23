import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./components/home/home.component";
import { VariantsIndexComponent } from "./components/variants-index/variants-index.component";
import { VariantFormComponent } from "./components/variant-form/variant-form.component";
import { AuthGuard } from "./guards/auth.guard";
import { VariantShowComponent } from "./components/variant-show/variant-show.component";
import { PieceRuleFormComponent } from "./components/piece-rule-form/piece-rule-form.component";
import { TerrainRuleFormComponent } from "./components/terrain-rule-form/terrain-rule-form.component";
import { ChallengesIndexComponent } from "./components/challenges-index/challenges-index.component";
import { GamesIndexComponent } from "./components/games-index/games-index.component";
import { GameShowComponent } from "./components/game-show/game-show.component";

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent,
  },
  {
    path: "variants",
    component: VariantsIndexComponent,
  },
  {
    path: "variants/new",
    component: VariantFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "variants/:variantId",
    component: VariantShowComponent,
  },
  {
    path: "variants/:variantId/edit",
    component: VariantFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "variants/:variantId/pieceRules/new",
    component: PieceRuleFormComponent,
  },
  {
    path: "variants/:variantId/pieceRules/:pieceRuleId/edit",
    component: PieceRuleFormComponent,
  },
  {
    path: "variants/:variantId/terrainRules/new",
    component: TerrainRuleFormComponent,
  },
  {
    path: "variants/:variantId/terrainRules/:terrainRuleId/edit",
    component: TerrainRuleFormComponent,
  },
  {
    path: "challenges",
    component: ChallengesIndexComponent,
  },
  {
    path: "games",
    component: GamesIndexComponent,
  },
  {
    path: "games/:gameId",
    component: GameShowComponent,
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
