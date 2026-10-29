import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AIHomePage } from './aihome-page';

describe('AIHomePage', () => {
  let component: AIHomePage;
  let fixture: ComponentFixture<AIHomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AIHomePage],
    }).compileComponents();

    fixture = TestBed.createComponent(AIHomePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
