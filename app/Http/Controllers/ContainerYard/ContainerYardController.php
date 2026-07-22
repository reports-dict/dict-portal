<?php

namespace App\Http\Controllers\ContainerYard;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ContainerYardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('container-yard/index');
    }

    public function search(): Response
    {
        return Inertia::render('container-yard/search');
    }
}
