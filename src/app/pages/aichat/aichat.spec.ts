import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AIChat } from './aichat';

describe('AIChat', () => {
  let component: AIChat;
  let fixture: ComponentFixture<AIChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AIChat],
    }).compileComponents();

    fixture = TestBed.createComponent(AIChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
