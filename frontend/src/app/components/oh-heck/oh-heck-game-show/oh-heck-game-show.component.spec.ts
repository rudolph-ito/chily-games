import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OhHeckGameShowComponent } from './oh-heck-game-show.component';

describe('OhHeckGameShowComponent', () => {
  let component: OhHeckGameShowComponent;
  let fixture: ComponentFixture<OhHeckGameShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OhHeckGameShowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OhHeckGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
