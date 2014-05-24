source 'https://rubygems.org'

ruby '2.1.1'

gem 'rails', '4.0.1'

gem 'activeadmin', github: 'gregbell/active_admin' # Admin
gem 'authority' # Authorization
gem 'carrierwave' # File Upload
gem 'coffee-rails', '~> 4.0.1'
gem 'compass-rails'
gem 'devise' # User Sessions
gem 'foreman' # Process Manager
gem 'formtastic', "~> 2.3.0.rc2" # Forms
gem 'haml-rails' # HAML for views
gem 'jquery-rails' # JQuery for javascript
gem 'pg' # database
gem 'rabl' # JSON API
gem 'redcarpet' # For converting markdown to html (for quotes)
gem 'sass-rails',   '~> 4.0.1'
gem 'sprockets-commonjs'
gem 'thin' # Make server run faster
gem 'turbolinks' # Turbolinks
gem 'uglifier', '>= 1.0.3'
gem 'underscore-rails' # Underscore for javascript

group :development, :test do
  gem 'teaspoon'
end

group :test do
  gem 'capybara'
  gem 'database_cleaner'
  gem 'factory_girl_rails'
  gem 'rspec-rails'
  gem 'selenium-webdriver'
  gem 'simplecov', '~> 0.7.1'
end

group :production do
  gem 'fog'
  gem 'rails_12factor'
end
