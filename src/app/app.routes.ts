import { Routes } from '@angular/router';
import { AIHomePage } from './pages/aihome-page/aihome-page';

export const routes: Routes = [
  { path: '', component: AIHomePage },
  { path: '**', redirectTo: '' },
];
