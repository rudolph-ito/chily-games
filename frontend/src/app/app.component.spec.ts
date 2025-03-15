import { TestBed, ComponentFixture } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";
import { AuthenticationService } from "./services/authentication.service";
import {
  getMockAuthenticationService,
  IMockedAuthenticationService,
} from "./test/mock-services";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockedAuthenticationService: IMockedAuthenticationService;

  beforeEach(() => {
    mockedAuthenticationService = getMockAuthenticationService();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppModule],
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockedAuthenticationService.service,
        },
      ],
    });
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
