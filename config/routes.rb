Cyvasse::Application.routes.draw do
  resources :challenges, only: [:index, :create, :destroy], defaults: {format: 'json'} do
    member do
      put 'accept'
      put 'decline'
    end
  end

  resources :piece_types
  resources :terrain_types

  devise_for :users
  resources :users

  resources :variants do
    resources :piece_rules, only: [:new, :create]
    resources :terrain_rules, only: [:new, :create]
    member do
      get :preview
    end
  end

  resources :piece_rules, only: [:edit, :update, :destroy]
  resources :terrain_rules, only: [:edit, :update, :destroy]

  get '/explore' => 'home#explore'
  get '/create' => 'home#create'
  get '/play' => 'home#play'

  root to: 'home#index'
end
