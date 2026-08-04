<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use Illuminate\Http\JsonResponse;

class OnlineUsersController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Session::onlineUsers());
    }
}
