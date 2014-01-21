Cyvasse::Application.routes.draw do
  namespace :api, defaults: { format: :json } do
    resources :challenges, only: [:index, :create, :destroy] do
      member do
        put 'accept'
        put 'decline'
      end
    end

    resources :games, only: [:show] do
      collection do
        get 'current'
      end

      member do
        get 'valid_piece_moves'

        put 'abort'
        put 'setup_add_piece'
        put 'setup_move_piece'
        put 'setup_remove_piece'
        put 'setup_complete'

        put 'piece_move'
        put 'resign'
      end
    end
  end

  resources :piece_rules, only: [:edit, :update, :destroy]
  resources :piece_types

  resources :terrain_rules, only: [:edit, :update, :destroy]
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

  get '/explore' => 'home#explore'
  get '/create' => 'home#create'
  get '/play' => 'home#play'

  root to: 'home#index'
end
