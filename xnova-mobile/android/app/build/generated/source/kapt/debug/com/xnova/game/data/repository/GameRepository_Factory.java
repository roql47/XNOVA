package com.xnova.game.data.repository;

import com.xnova.game.data.remote.ApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class GameRepository_Factory implements Factory<GameRepository> {
  private final Provider<ApiService> apiServiceProvider;

  public GameRepository_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public GameRepository get() {
    return newInstance(apiServiceProvider.get());
  }

  public static GameRepository_Factory create(Provider<ApiService> apiServiceProvider) {
    return new GameRepository_Factory(apiServiceProvider);
  }

  public static GameRepository newInstance(ApiService apiService) {
    return new GameRepository(apiService);
  }
}
