import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guards';
import { Shell } from './layout/shell/shell';
import { AuthService } from './services/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Iniciar sesión · Corteza ERP',
    loadComponent: () => import('./features/auth/login/login'),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      // 07 · Administrador
      {
        path: 'home',
        canMatch: [roleGuard()],
        title: 'Inicio · Corteza ERP',
        loadComponent: () => import('./features/admin/home/admin-home'),
      },
      {
        path: 'reports',
        canMatch: [roleGuard()],
        title: 'Reportes · Corteza ERP',
        loadComponent: () => import('./features/coming-soon/coming-soon'),
        data: { module: 'Reportes', phase: 6, screens: '¿Cómo va la panadería? (07.1)' },
      },

      // 01 · CRM (Clientes)
      {
        path: 'customers',
        canMatch: [roleGuard('CRM')],
        children: [
          { path: '', title: 'Clientes · Corteza ERP', loadComponent: () => import('./features/crm/customers-list/customers-list') },
          { path: 'new', title: 'Nuevo cliente · Corteza ERP', loadComponent: () => import('./features/crm/customer-form/customer-form') },
          { path: ':id/edit', title: 'Editar cliente · Corteza ERP', loadComponent: () => import('./features/crm/customer-form/customer-form') },
        ],
      },

      // 02 · Facturación y Ventas (fase 3)
      {
        path: 'sales',
        canMatch: [roleGuard('SALES', 'CRM')],
        title: 'Facturación y Ventas · Corteza ERP',
        loadComponent: () => import('./features/coming-soon/coming-soon'),
        data: {
          module: 'Facturación y Ventas',
          phase: 3,
          screens: 'Pedidos · Nuevo pedido · Detalle · Mesas · Cuenta y cobro · Facturas de venta (02.1 a 02.6)',
        },
      },

      // 03 · Inventarios
      {
        path: 'inventory',
        canMatch: [roleGuard('INVENTORY')],
        children: [
          { path: '', title: 'Inventario · Corteza ERP', loadComponent: () => import('./features/inventory/supplies-list/supplies-list') },
          { path: 'supplies/new', title: 'Agregar insumo · Corteza ERP', loadComponent: () => import('./features/inventory/supply-form/supply-form') },
          { path: 'supplies/:id/edit', title: 'Editar insumo · Corteza ERP', loadComponent: () => import('./features/inventory/supply-form/supply-form') },
          { path: 'movement', title: 'Registrar movimiento · Corteza ERP', loadComponent: () => import('./features/inventory/inventory-entry/inventory-entry') },
        ],
      },

      // 04 · Proveedores
      {
        path: 'suppliers',
        canMatch: [roleGuard('SUPPLIERS')],
        children: [
          { path: '', title: 'Proveedores · Corteza ERP', loadComponent: () => import('./features/suppliers/suppliers-list/suppliers-list') },
          { path: 'new', title: 'Añadir proveedor · Corteza ERP', loadComponent: () => import('./features/suppliers/supplier-form/supplier-form') },
          { path: ':id/edit', title: 'Editar proveedor · Corteza ERP', loadComponent: () => import('./features/suppliers/supplier-form/supplier-form') },
        ],
      },

      // 05 · Compras: órdenes de compra y solicitudes de cotización
      {
        path: 'purchases',
        canMatch: [roleGuard('PURCHASES')],
        children: [
          { path: '', title: 'Compras · Corteza ERP', loadComponent: () => import('./features/purchases/purchase-orders-list/purchase-orders-list') },
          { path: 'orders/new', title: 'Nueva orden de compra · Corteza ERP', loadComponent: () => import('./features/purchases/purchase-order-form/purchase-order-form') },
          { path: 'orders/:id', title: 'Orden de compra · Corteza ERP', loadComponent: () => import('./features/purchases/purchase-order-detail/purchase-order-detail') },
          { path: 'quotations', title: 'Solicitudes de cotización · Corteza ERP', loadComponent: () => import('./features/purchases/quotation-requests-list/quotation-requests-list') },
          { path: 'quotations/new', title: 'Nueva solicitud de cotización · Corteza ERP', loadComponent: () => import('./features/purchases/quotation-request-form/quotation-request-form') },
          { path: 'quotations/:id', title: 'Solicitud de cotización · Corteza ERP', loadComponent: () => import('./features/purchases/quotation-request-detail/quotation-request-detail') },
        ],
      },

      // 06 · Talento Humano
      {
        path: 'hr',
        canMatch: [roleGuard('HR')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'employees' },
          { path: 'employees', title: 'Empleados · Corteza ERP', loadComponent: () => import('./features/hr/employees-list/employees-list') },
          { path: 'employees/new', title: 'Nuevo empleado · Corteza ERP', loadComponent: () => import('./features/hr/employee-form/employee-form') },
          { path: 'employees/:id/edit', title: 'Editar empleado · Corteza ERP', loadComponent: () => import('./features/hr/employee-form/employee-form') },
          {
            path: 'payroll',
            title: 'Nómina · Corteza ERP',
            loadComponent: () => import('./features/coming-soon/coming-soon'),
            data: { module: 'Nómina', phase: 5, screens: 'Calendario de pagos · Comprobante de nómina (06.0 y 06.3)' },
          },
        ],
      },

      // Cada rol aterriza en su módulo.
      { path: '', pathMatch: 'full', redirectTo: () => inject(AuthService).homeRoute() },
    ],
  },
  { path: '**', redirectTo: '' },
];
