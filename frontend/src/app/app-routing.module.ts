import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./components/home/home.component";
import { VariantsIndexComponent } from "./components/variants-index/variants-index.component";
import { VariantFormComponent } from "./components/variant-form/variant-form.component";
import { AuthGuard } from "./guards/auth.guard";
import { VariantShowComponent } from "./components/variant-show/variant-show.component";

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent
  },
  {
    path: "variants",
    component: VariantsIndexComponent
  },
  {
    path: "variants/new",
    component: VariantFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "variants/:id",
    component: VariantShowComponent
  },
  {
    path: "variants/:id/edit",
    component: VariantFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
